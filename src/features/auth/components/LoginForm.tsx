import { useCallback, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { LoginSchema, type LoginFormValues } from '../schemas/auth-schema'
import { login } from '@/api/services/auth-service'
import { TextField } from '@/components/form/fields'
import { PasswordField } from './PasswordField'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 30_000 // 30 seconds

export function LoginForm() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const [lockoutEnd, setLockoutEnd] = useState<number | null>(null)
  const [lockoutRemaining, setLockoutRemaining] = useState(0)
  const failedAttempts = useRef(0)
  const lockoutTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const { control, handleSubmit, formState: { isSubmitting }, setValue, watch } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      identifier: '',
      password: '',
      rememberMe: false,
    },
  })

  const rememberMe = watch('rememberMe')
  const isLockedOut = lockoutEnd !== null && Date.now() < lockoutEnd

  const startLockout = useCallback(() => {
    const end = Date.now() + LOCKOUT_DURATION_MS
    setLockoutEnd(end)
    setLockoutRemaining(Math.ceil(LOCKOUT_DURATION_MS / 1000))

    if (lockoutTimer.current) clearInterval(lockoutTimer.current)
    lockoutTimer.current = setInterval(() => {
      const remaining = Math.ceil((end - Date.now()) / 1000)
      if (remaining <= 0) {
        setLockoutEnd(null)
        setLockoutRemaining(0)
        failedAttempts.current = 0
        if (lockoutTimer.current) clearInterval(lockoutTimer.current)
      } else {
        setLockoutRemaining(remaining)
      }
    }, 1000)
  }, [])

  async function onSubmit(data: LoginFormValues) {
    if (isLockedOut) return

    setServerError(null)
    try {
      await login({
        identifier: data.identifier.trim(),
        password: data.password,
        rememberMe: data.rememberMe,
      })
      failedAttempts.current = 0
      navigate('/', { replace: true })
    } catch (error: unknown) {
      const err = error as { message?: string; status?: number }
      failedAttempts.current += 1

      if (err.status === 429) {
        // Backend rate limit — respect it
        setServerError(err.message || 'Too many attempts. Please try again later.')
        startLockout()
        return
      }

      const remaining = MAX_ATTEMPTS - failedAttempts.current
      if (remaining <= 0) {
        startLockout()
        setServerError(`Too many failed attempts. Please wait ${Math.ceil(LOCKOUT_DURATION_MS / 1000)} seconds.`)
      } else if (remaining <= 2) {
        setServerError(`${err.message || 'Invalid credentials.'} ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`)
      } else {
        setServerError(err.message || 'Invalid credentials. Please try again.')
      }
    }
  }

  return (
    <div className="flex flex-col items-center">
      <h2 className="mb-1 text-center text-xl font-bold" style={{ color: 'var(--heading)' }}>
        Login to Your Account
      </h2>
      <p className="mb-8 text-center text-sm text-muted-foreground">
        Access your dashboard and continue where you left off
      </p>

      {serverError && (
        <div className="mb-4 w-full rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-5">
        <TextField<LoginFormValues>
          name="identifier"
          control={control}
          label="Email or Phone Number"
          placeholder="yourname@example.com or +91 98765 43210"
        />

        <PasswordField<LoginFormValues>
          name="password"
          control={control}
          label="Password"
          placeholder="Enter your password"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember-me"
              checked={rememberMe}
              onCheckedChange={checked => setValue('rememberMe', checked === true)}
            />
            <Label htmlFor="remember-me" className="text-sm font-normal text-muted-foreground cursor-pointer">
              Remember Me
            </Label>
          </div>
          <Link
            to="/forgot-password"
            className="text-sm font-medium hover:underline"
            style={{ color: 'var(--heading)' }}
          >
            Forgot Password?
          </Link>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || isLockedOut}
          className="h-11 w-full rounded-full text-sm font-semibold text-white"
          style={{ backgroundColor: isLockedOut ? undefined : 'var(--heading)' }}
        >
          {isLockedOut ? (
            `Try again in ${lockoutRemaining}s`
          ) : isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging in...
            </>
          ) : (
            'Login'
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to Sanketa?{' '}
        <Link
          to="/register"
          className="font-semibold hover:underline"
          style={{ color: 'var(--heading)' }}
        >
          Create account
        </Link>
      </p>
    </div>
  )
}
