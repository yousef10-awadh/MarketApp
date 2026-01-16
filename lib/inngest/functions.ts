import { success } from "better-auth";
import { inngest } from "./client";
import { PERSONALIZED_WELCOME_EMAIL_PROMPT, NEWS_SUMMARY_EMAIL_PROMPT } from "./prompts";
import { sendWelcomeEmail, sendNewsEmail } from "../nodemailer";
import { getAllUsersForNewsEmail } from "../actions/user.action";
import { getWatchlistSymbolsByEmail } from "../actions/watchlist.actions";
import { getNews } from "../actions/finnhub.actions";
import { getFormattedTodayDate } from "../utils";

export const sendSignUpEmail = inngest.createFunction(
    {id: 'sign-up-email'},
    {event:'app/user.created'},
    async({event,step}) => {
        const userProfile = `
            - country: ${event.data.country}
            - Investment goals: ${event.data.investmentGoals}
            - Risk tolerance: ${event.data.riskTolerance}
            - Preferred industry: ${event.data.preferredIndustry}
        `

        const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace('{{userProfile}}',userProfile)

        const response = await step.ai.infer('generate-welcome-intro',{
            model: step.ai.models.gemini({model: 'gemini-2.5-flash'}),
                body:{ 
                    contents:
                    [
                        {
                            role:'user',
                            parts:[
                                {text:prompt}
                            ]
                        }
                    ]
                }
        })

        await step.run('send-welcome-email',async () =>{
            const part = response.candidates?.[0]?.content?.parts?.[0];
            const introText = (part && 'text' in part ? part.text : null) || 'Thanks for joining Signalist. You now have the tools as track markets and make smarter moves'
            const {data:{email,name}} = event;
            return await sendWelcomeEmail({
                email,
                name,
                intro:introText
            })
        })

        return{
            success:true,
            message: 'Welcome email sent successfully'
        }

    }
    
)

export const sendDailyNewsSummary = inngest.createFunction(
    {id: 'daily-news-summary'},
    [{event:'app/send.daily.news'},{cron:'0 12 * * *'}],
    async ({step}) => {
        //! Step #1: Get all users for news delivery
        const users = await step.run('get-all-users-for-news-email',getAllUsersForNewsEmail);
        if(!users || users.length === 0) return {success: false, message: 'No users found for news email'}
        

        // ?The AI Modification
        //! Step #2: Fetch personalized news for each user
        const results = await step.run(`fetch-news-for-each-user`, async () => {
            const perUser: Array<{user:User,articles:MarketNewsArticle[]}> = [];
            for (const user of users as User[]) {
                // Get user's watchlist symbols
                try {
                    const symbols = await getWatchlistSymbolsByEmail(user.email);
                    let articles = await getNews(symbols);
                    articles = (articles || []).slice(0, 6);
                    if(!articles || articles.length === 0){
                        articles = await getNews();
                        articles = (articles || []).slice(0, 6);
                    }
                    perUser.push({ user, articles });
                } catch (e) {
                    console.error(`Error fetching news for user:`,user.email, e);
                    perUser.push({ user, articles:[] });

                }
                
                //// Fetch news (or general if no symbols)
                
                
            }
            return perUser;
        });
        
        
        //! Step #3: Summarize news via AI for each user (placeholder)
        // TODO: Implement AI summarization using NEWS_SUMMARY_EMAIL_PROMPT
        const userNewsSummaries: {user:User,newsContent:string | null}[] = [];
        
        for (const {user,articles} of results) {
            
            try {
                const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace('{{newsData}}',JSON.stringify(articles));
                const response = await step.ai.infer(`summarize-news-for-user-${user.email}`,{
                    model: step.ai.models.gemini({model: 'gemini-2.5-flash'}),
                    body:{
                        contents:
                        [
                            {
                                role:'user',
                                parts:[{text:prompt}]
                            }
                        ]
                    }
                })
                const part = response.candidates?.[0]?.content?.parts?.[0];
                const newsContent = (part && 'text' in part ? part.text : null) || 'No news summary available';
                userNewsSummaries.push({user,newsContent});
            } catch (e) {
                console.error(`Error summarizing news for user:`,user.email);
                userNewsSummaries.push({user,newsContent:null});
            }
            
        }
        
        //! Step #4: Send emails (placeholder)
        // TODO: Implement email sending using sendNewsEmail
        await step.run(`send-news-emails`,async () => {
            await Promise.all(
                userNewsSummaries.map(async ({user,newsContent}) => {
                    if (!newsContent) return false;
                    return await sendNewsEmail({email:user.email,date:getFormattedTodayDate(),newsContent});
                        
                    
                }
            ))
        });
        return { success: true ,message: 'News emails sent successfully'};
    }
    
)