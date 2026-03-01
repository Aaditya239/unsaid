import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

export const metadata = {
    title: 'Forgot Password - UNSAID',
    description: 'Request a password reset link for your UNSAID account',
};

export default function ForgotPasswordPage() {
    return <ForgotPasswordForm />;
}
