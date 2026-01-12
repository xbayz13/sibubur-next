'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ToastContainer';
import { LoginRequest } from '@/types';
import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import Checkbox from '@/components/form/Checkbox';
import Button from '@/components/ui/Button';
import { EyeIcon, EyeCloseIcon, ChevronLeftIcon } from '@/components/icons';

export default function LoginPage() {
  const [credentials, setCredentials] = useState<LoginRequest>({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(credentials);
      showToast('Login berhasil!', 'success');
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 500);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Login gagal. Periksa kembali username dan password Anda.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900 sm:p-0">
        <div className="flex flex-col flex-1">
          <div className="w-full max-w-md pt-10 mx-auto">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <ChevronLeftIcon className="w-5 h-5" />
              Back to dashboard
            </Link>
          </div>
          <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
            <div>
              <div className="mb-5 sm:mb-8">
                <div className="flex justify-center mb-4">
                  <img
                    src="/sibubur-high-resolution-logo-transparent.png"
                    alt="SiBubur Logo"
                    className="h-16 w-16 sm:h-20 sm:w-20 object-contain"
                  />
                </div>
                <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md text-center sm:text-left">
                  Sign In
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left">
                  Masukkan username dan password untuk masuk!
                </p>
              </div>
              <div>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    {error && (
                      <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg dark:bg-error-500/10 dark:border-error-500/20 dark:text-error-400">
                        {error}
                      </div>
                    )}

                    <div>
                      <Label htmlFor="username">
                        Username <span className="text-error-500">*</span>
                      </Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="Masukkan username"
                        value={credentials.username}
                        onChange={(e) =>
                          setCredentials({ ...credentials, username: e.target.value })
                        }
                        required
                        error={!!error}
                      />
                    </div>

                    <div>
                      <Label htmlFor="password">
                        Password <span className="text-error-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Masukkan password"
                          value={credentials.password}
                          onChange={(e) =>
                            setCredentials({ ...credentials, password: e.target.value })
                          }
                          required
                          error={!!error}
                          className="pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                          aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                        >
                          {showPassword ? (
                            <EyeIcon className="fill-gray-500 dark:fill-gray-400 w-5 h-5" />
                          ) : (
                            <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isChecked}
                          onChange={(checked) => setIsChecked(checked)}
                          id="remember"
                        />
                        <label
                          htmlFor="remember"
                          className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400 cursor-pointer"
                        >
                          Ingat saya
                        </label>
                      </div>
                    </div>

                    <div>
                      <Button type="submit" className="w-full" size="sm" disabled={loading}>
                        {loading ? 'Masuk...' : 'Masuk'}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        <div className="items-center hidden w-full h-full lg:w-1/2 bg-brand-950 dark:bg-white/5 lg:grid">
          <div className="relative flex items-center justify-center z-1">
            <div className="flex flex-col items-center max-w-xs">
              <Link href="/" className="block mb-4">
                <img
                  src="/sibubur-high-resolution-logo-transparent.png"
                  alt="SiBubur Logo"
                  className="h-16 w-auto object-contain"
                />
              </Link>
              <p className="text-center text-gray-400 dark:text-white/60">
                Sistem Point of Sale untuk Aplikasi SiBubur
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
