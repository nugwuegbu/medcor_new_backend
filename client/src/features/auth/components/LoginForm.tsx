import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { LoginCredentials } from '@/types/user';
import { isValidEmail } from '@/utils/validators';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

interface LoginFormProps {
  onSubmit: (data: LoginCredentials) => Promise<void>;
  onForgotPassword?: () => void;
  onSignup?: () => void;
  tenantId?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onForgotPassword,
  onSignup,
  tenantId,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
      tenantId,
    },
  });

  const handleSubmit = async (data: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      await onSubmit({ ...data, tenantId });
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between">
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    {...field}
                    disabled={isLoading}
                    checked={field.value}
                  />
                </FormControl>
                <FormLabel className="!mt-0 cursor-pointer">Remember me</FormLabel>
              </FormItem>
            )}
          />

          {onForgotPassword && (
            <Button
              type="button"
              variant="link"
              onClick={onForgotPassword}
              disabled={isLoading}
              className="p-0"
            >
              Forgot password?
            </Button>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <LoadingSpinner size="sm" text="Signing in..." /> : 'Sign In'}
        </Button>

        {onSignup && (
          <div className="text-center">
            <span className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Button
                type="button"
                variant="link"
                onClick={onSignup}
                disabled={isLoading}
                className="p-0"
              >
                Sign up
              </Button>
            </span>
          </div>
        )}
      </form>
    </Form>
  );
};