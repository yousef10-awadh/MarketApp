'use client'
import FooterLink from '@/components/forms/FooterLink'
import InputField from '@/components/forms/InputField'
import { Button } from '@/components/ui/button'
import { signInWithEmail } from '@/lib/actions/auth.actions'
import { useRouter } from 'next/navigation'
import React from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'

const SignIn = () => {
  const router = useRouter()
  const {
          register,
          handleSubmit,
          formState: { errors , isSubmitting},
      } = useForm<SignInFormData>({
          defaultValues:{
              email: '',
              password:'',
          },
          mode:'onBlur'
          
      })
      const onSubmit= async (data:SignInFormData) => {
        try{
            const result = await signInWithEmail(data);
            if(result.success) router.push('/');
        }
        catch(e){
            console.error(e);
            toast.error('Sign In Failed',{
                description: e instanceof Error ? e.message : 'Sign In Failed'
            });
        }
    }


  return (
    <>
      <h1 className='form-title'>Sign In & Have Fun With Your Trip</h1>
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
              <InputField
              name='email'
              type='email'
              label='E-mail'
              placeholder='anything@gmail.com'
              register={register}
              error={errors.email}
              validation={{required:"E-mail Is Required",pattern:/^\w+@\w+\.\w+$/,message:'E-mail address is required'}}
              />
              <InputField
              name='password'
              type='password'
              label='Password'
              placeholder='126521#cdcAW'
              register={register}
              error={errors.password}
              validation={{required:"Password Is Required",minLength:8}}
              />
              <Button type='submit' disabled={isSubmitting} className='yellow-btn w-full mt-5'>
                {isSubmitting ? 'Entring You To Your Investment World' : 'Enter to Your Investment world'}
              </Button>
              <FooterLink
              text='You Do Not Have An Account Yet?!!'
              linkText='Join Now'
              href='/sign-up'
              />
            </form>
    </>
  )
}

export default SignIn