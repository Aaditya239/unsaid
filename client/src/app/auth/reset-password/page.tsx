import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export const metadata = {
    title: 'Reset Password - UNSAID',
    description: 'Securely reset your UNSAID account password',
};

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="w-8 h-8 text-electric animate-spin" />
                <p className="text-softwhite/40 text-sm tracking-widest">Validating link...</p>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
