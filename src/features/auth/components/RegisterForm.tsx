import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { RegisterSchema, type RegisterFormValues } from '../schemas/auth-schema'
import { mockRegister } from '@/mocks/auth'
import { TextField } from '@/components/form/fields'
import { PhoneNumberFieldWithCountryCode } from '@/components/form/fields'
import { PasswordField } from './PasswordField'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { baseColors } from '@/theme/colors'

export function RegisterForm() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
    setValue,
    watch,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phoneCountryCode: '+91',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false as unknown as true,
    },
  })

  const agreeToTerms = watch('agreeToTerms')

  async function onSubmit(data: RegisterFormValues) {
    setServerError(null)
    try {
      await mockRegister({
        fullName: data.fullName,
        email: data.email,
        phoneCountryCode: data.phoneCountryCode || '+91',
        phoneNumber: data.phoneNumber,
        password: data.password,
      })
      navigate('/', { replace: true })
    } catch (error: unknown) {
      const err = error as { message?: string }
      setServerError(err.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="flex flex-col items-center">
      {/* Logo (mobile/tablet — on desktop it's in the hero) */}
      <div className="mb-6 flex items-center gap-2 lg:hidden">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-soft to-accent-soft">
          <span className="text-lg font-bold" style={{ color: 'var(--heading)' }}>S</span>
        </div>
      </div>

      <h2 className="mb-1 text-center text-xl font-bold" style={{ color: 'var(--heading)' }}>
        Create Your Account
      </h2>
      <p className="mb-8 text-center text-sm text-muted-foreground">
        Join Sanketa today and get started with smarter school management
      </p>

      {serverError && (
        <div className="mb-4 w-full rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-5">
        <TextField<RegisterFormValues>
          name="fullName"
          control={control}
          label="Full Name"
          placeholder="Enter your full name"
        />

        <TextField<RegisterFormValues>
          name="email"
          control={control}
          label="Email Address"
          type="email"
          placeholder="yourname@example.com"
        />

        <PhoneNumberFieldWithCountryCode<RegisterFormValues>
          control={control}
          countryCodeName="phoneCountryCode"
          phoneName="phoneNumber"
          label="Phone Number"
          placeholder="e.g. 98765 43210"
          defaultCountryCode="+91"
        />

        <PasswordField<RegisterFormValues>
          name="password"
          control={control}
          label="Password"
          placeholder="Create a secure password"
        />

        <PasswordField<RegisterFormValues>
          name="confirmPassword"
          control={control}
          label="Confirm Password"
          placeholder="Re-enter your password"
        />

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Checkbox
              id="agree-terms"
              checked={agreeToTerms === true}
              onCheckedChange={checked => setValue('agreeToTerms', checked === true ? true : (false as unknown as true), { shouldValidate: true })}
              aria-invalid={errors.agreeToTerms ? 'true' : 'false'}
            />
            <Label htmlFor="agree-terms" className="text-sm font-normal text-muted-foreground cursor-pointer">
              I agree to the{' '}
              <Link
                to="/terms"
                className="font-medium hover:underline"
                style={{ color: 'var(--heading)' }}
                onClick={e => e.stopPropagation()}
              >
                Terms & Conditions
              </Link>
            </Label>
          </div>
          {errors.agreeToTerms && (
            <p role="alert" className="text-destructive text-sm">
              {errors.agreeToTerms.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-11 w-full rounded-full text-sm font-semibold"
          style={{ backgroundColor: 'var(--primary)', color: 'var(--heading)' }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            'Register'
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold hover:underline"
          style={{ color: 'var(--heading)' }}
        >
          Login Here
        </Link>
      </p>
    </div>
  )
}
