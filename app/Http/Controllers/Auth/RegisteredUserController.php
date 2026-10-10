<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AppSettings;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /** Anyone can sign up unless an admin closed registration. The very first account always can. */
    private function open(): bool
    {
        return AppSettings::registrationOpen() || ! User::exists();
    }

    public function create(): Response
    {
        abort_unless($this->open(), 404);

        return Inertia::render('Auth/Register', ['firstUser' => ! User::exists()]);
    }

    /**
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        abort_unless($this->open(), 404);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $first = ! User::exists();

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password, // hashed by the model cast
        ]);

        if ($first) {
            // The person who installs the app is its admin.
            $user->forceFill(['is_admin' => true])->save();
        }

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('dashboard', absolute: false));
    }
}
