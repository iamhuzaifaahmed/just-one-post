import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register({ firstUser }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), { onFinish: () => reset('password', 'password_confirmation') });
    };

    const field = (id, label, type = 'text', extra = {}) => (
        <div>
            <InputLabel htmlFor={id} value={label} />
            <TextInput
                id={id}
                name={id}
                type={type}
                value={data[id]}
                className="mt-1.5"
                onChange={(e) => setData(id, e.target.value)}
                required
                {...extra}
            />
            <InputError message={errors[id]} className="mt-2" />
        </div>
    );

    return (
        <GuestLayout>
            <Head title="Create account" />

            <h1 className="text-2xl font-bold tracking-tight text-fg">{firstUser ? 'Create the admin account' : 'Create your account'}</h1>
            <p className="mt-1 text-sm text-muted">
                Free to use. You will connect your own social accounts after signing up.
            </p>

            <form onSubmit={submit} className="mt-8 space-y-5">
                {field('name', 'Name', 'text', { autoComplete: 'name', isFocused: true })}
                {field('email', 'Email', 'email', { autoComplete: 'username' })}
                {field('password', 'Password', 'password', { autoComplete: 'new-password' })}
                {field('password_confirmation', 'Confirm password', 'password', { autoComplete: 'new-password' })}

                <PrimaryButton className="w-full" disabled={processing}>
                    {processing ? 'Creating…' : 'Create account'}
                </PrimaryButton>
            </form>

            <p className="mt-6 text-center text-sm text-muted">
                Already registered?{' '}
                <Link href={route('login')} className="font-medium text-brand hover:text-brand">
                    Log in
                </Link>
            </p>
        </GuestLayout>
    );
}
