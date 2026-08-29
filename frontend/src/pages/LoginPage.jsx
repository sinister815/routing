import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { loginUser, clearError } from '../store/slices/authSlice.js';
import { Input } from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, submitting, error } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const onSubmit = async (data) => {
    const resultAction = await dispatch(loginUser(data));
    if (loginUser.fulfilled.match(resultAction)) {
      navigate('/analytics');
    }
  };

  return (
    <div className="min-h-screen bg-page flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link to="/" className="inline-flex items-center space-x-2.5">
          <span className="text-2xl font-display font-semibold text-ink">TrackFlow</span>
        </Link>
        <h2 className="text-xl font-semibold text-ink tracking-tight">Sign in</h2>
        <p className="text-sm text-muted">Access your routing dashboard</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-6 sm:px-10 border border-border rounded-xl shadow-card space-y-6">
          {error && (
            <div className="bg-danger/5 border border-danger/20 text-danger text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Form in Vertical Format */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              icon={Mail}
              placeholder="Enter your email"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: 'Invalid email address',
                },
              })}
            />

            <Input
              label="Password"
              type="password"
              required
              icon={Lock}
              placeholder="Enter your password"
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={submitting}
              className="w-full mt-2"
              icon={ArrowRight}
            >
              Sign in
            </Button>
          </form>

          <div className="text-center text-sm text-muted">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary hover:text-primary-hover">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
