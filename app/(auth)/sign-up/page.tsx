'use client'

import { CountrySelectField } from '@/components/forms/CountrySelectField'
import FooterLink from '@/components/forms/FooterLink'
import InputField from '@/components/forms/InputField'
import SelectField from '@/components/forms/SelectField'
import { Button } from '@/components/ui/button'
import { INVESTMENT_GOALS, PREFERRED_INDUSTRIES, RISK_TOLERANCE_OPTIONS } from '@/lib/constants'
import React from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'

const SignUp = () => {

    const {
        register,
        handleSubmit,
        control,
        formState: { errors , isSubmitting},
    } = useForm<SignUpFormData>({
        defaultValues:{
            fullName:'',
            email: '',
            password:'',
            country: 'US',
            investmentGoals: 'Growth',
            riskTolerance: 'Low',
            preferredIndustry: 'Technology'
        },
        mode:'onBlur'
        
    })
    const onSubmit= async (data:SignUpFormData) => {
        try{

            console.log(data)
        }
        catch(e){
            console.error(e)
        }
    } 
  return (
    <>
        <h1 className='form-title'>Sign Up & Personalize</h1>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
            <InputField
            name='fullName'
            label='Full Name'
            placeholder='Yousef Awadh'
            register={register}
            error={errors.fullName}
            validation={{required:"Full Name Is Required",minLength:2}}
            />
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

            <CountrySelectField
            name='Countries'
            label='Country'
            control={control}
            error={errors.country}
            required
            />

            <SelectField 
            name='investmentGoals'
            label='Investment Goals'
            placeholder='Select Your Investment Goal'
            options={INVESTMENT_GOALS}
            control={control}
            error={errors.investmentGoals}
            required
            />
            <SelectField 
            name='riskTolerance'
            label='Risk Tolerance'
            placeholder='Select Your Risk Level'
            options={RISK_TOLERANCE_OPTIONS}
            control={control}
            error={errors.riskTolerance}
            required
            />
            <SelectField 
            name='preferredIndustry'
            label='preferred Industry'
            placeholder='Select Your preferred Industry'
            options={PREFERRED_INDUSTRIES}
            control={control}
            error={errors.preferredIndustry}
            required
            />


            <Button type='submit' disabled={isSubmitting} className='yellow-btn w-full mt-5'>
                {isSubmitting ? 'Creating account' : 'Start Your Investing Trip'}
            </Button>
            <FooterLink
            text='Already have an account'
            linkText='Sign in'
            href='/sign-in'
            />
        </form>
    </>
  )
}

export default SignUp