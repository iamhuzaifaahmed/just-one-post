import CopyField from '@/Components/CopyField';
import { LangContext, Callout, Ext, Faq, GoConnections, GoSettings, PasteMap, RedirectBox, Section, Step, Steps, UI, Val, Words } from '@/Components/GuideParts';
import Icon from '@/Components/Icon';
import PageHeader from '@/Components/PageHeader';
import PlatformIcon from '@/Components/PlatformIcon';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { MoreBn, MoreEn } from './More';
import { DiscordBn, DiscordEn, TelegramBn, TelegramEn, ThreadsBn, ThreadsEn, WordPressBn, WordPressEn, XBn, XEn } from './Platforms';
import { FixBn, LinkedInBn, LiveBn, MetaBn, PublicBn, StartHereBn, YouTubeBn } from './Bn';

const TABS = [
    { id: 'start', en: 'Start here', bn: 'এখান থেকে শুরু', icon: <Icon name="book" className="h-5 w-5" /> },
    { id: 'linkedin', en: 'LinkedIn', bn: 'LinkedIn', icon: <PlatformIcon platform="linkedin" size="sm" /> },
    { id: 'meta', en: 'Facebook & Instagram', bn: 'Facebook ও Instagram', icon: <PlatformIcon platform="facebook" size="sm" /> },
    { id: 'youtube', en: 'YouTube', bn: 'YouTube', icon: <PlatformIcon platform="youtube" size="sm" /> },
    { id: 'threads', en: 'Threads', bn: 'Threads', icon: <PlatformIcon platform="threads" size="sm" /> },
    { id: 'x', en: 'X (Twitter)', bn: 'X (Twitter)', icon: <PlatformIcon platform="x" size="sm" /> },
    { id: 'telegram', en: 'Telegram', bn: 'Telegram', icon: <PlatformIcon platform="telegram" size="sm" /> },
    { id: 'discord', en: 'Discord', bn: 'Discord', icon: <PlatformIcon platform="discord" size="sm" /> },
    { id: 'wordpress', en: 'WordPress', bn: 'WordPress', icon: <PlatformIcon platform="wordpress" size="sm" /> },
    { id: 'more', en: 'Add more accounts', bn: 'আরও অ্যাকাউন্ট যোগ করুন', icon: <Icon name="plus" className="h-5 w-5" /> },
    { id: 'public', en: 'Instagram public link', bn: 'Instagram পাবলিক লিংক', icon: <Icon name="globe" className="h-5 w-5" /> },
    { id: 'live', en: 'Put it on your website', bn: 'ওয়েবসাইটে চালু করুন', icon: <Icon name="upload" className="h-5 w-5" /> },
    { id: 'fix', en: 'Something went wrong?', bn: 'সমস্যা হচ্ছে?', icon: <Icon name="alert" className="h-5 w-5" /> },
];

/* -------------------------------------------------------------------------- */

function StartHere({ setTab }) {
    return (
        <Section
            title="Start here"
            subtitle="Read this once. It takes 2 minutes and makes everything else easier."
        >
            <Words>
                <p>
                    To post on LinkedIn, Facebook, Instagram and YouTube <b>for you</b>, this tool needs permission from each of them.
                    Each website gives that permission through a small free thing called an <b>“app”</b> that <b>you create yourself</b> on their
                    developer website. Creating it is free. It is just a form.
                </p>
                <p className="mt-2">
                    When you finish, each app gives you two codes: a <b>Client ID</b> (like a username) and a <b>Client Secret</b> (like a
                    password). You paste them into this tool’s <GoSettings /> page, then press <UI>Connect</UI> on the <GoConnections /> page.
                    That is all.
                </p>
            </Words>

            <div>
                <h3 className="mb-3 font-semibold text-slate-900">The 3 steps, for every platform</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {[
                        ['1', 'Create the app', 'On the platform’s developer website. This guide shows every click.'],
                        ['2', 'Copy 2 codes into Settings', 'Client ID and Client Secret. Plus one address (called Redirect URI) goes the other way.'],
                        ['3', 'Press Connect', 'Log in to your account and click Allow. Done. You never need to do it again (except every ~60 days for LinkedIn).'],
                    ].map(([n, t, d]) => (
                        <div key={n} className="card p-4">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">{n}</span>
                            <div className="mt-3 font-semibold text-slate-900">{t}</div>
                            <p className="mt-1 text-sm text-slate-500">{d}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="mb-3 font-semibold text-slate-900">Pick what you need</h3>
                <p className="mb-3 text-sm text-slate-500">You do not have to set up everything. Do only the platforms you want to post on.</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                        ['linkedin', ['linkedin'], 'LinkedIn', 'Post on your personal profile.', '~15 min'],
                        ['meta', ['facebook', 'instagram'], 'Facebook Page & Instagram', 'Needs a Facebook Page. Instagram must be a Business or Creator account.', '~25 min'],
                        ['youtube', ['youtube'], 'YouTube', 'Upload videos to your channel.', '~20 min'],
                        ['threads', ['threads'], 'Threads', 'Text, image and video posts. Needs a Meta developer app.', '~20 min'],
                        ['x', ['x'], 'X (Twitter)', 'Needs a developer app and credits (X charges per post).', '~25 min'],
                        ['telegram', ['telegram'], 'Telegram', 'Post to a channel or group with your own bot. No developer app.', '~10 min'],
                        ['discord', ['discord'], 'Discord', 'Post to a channel with a webhook link. The easiest one.', '~3 min'],
                        ['wordpress', ['wordpress'], 'WordPress', 'Publish blog posts with an Application Password.', '~5 min'],
                    ].map(([id, icons, t, d, time]) => (
                        <button
                            key={id}
                            onClick={() => setTab(id)}
                            className="card flex items-center gap-4 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
                        >
                            <span className="flex -space-x-2">
                                {icons.map((i) => (
                                    <PlatformIcon key={i} platform={i} size="lg" className="ring-4 ring-white" />
                                ))}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block font-semibold text-slate-900">{t}</span>
                                <span className="block text-sm text-slate-500">{d}</span>
                            </span>
                            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{time}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="mb-3 font-semibold text-slate-900">Before you begin, have these ready</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                    {[
                        'The accounts you want to post on (you must be able to log in to each one).',
                        'A phone nearby: some sites send a text or email code when you sign in.',
                        'About 20 minutes per platform, the first time only.',
                        'A place to keep your codes safely (a password manager or a private note). Never post your Client Secret anywhere public or send it to anyone.',
                    ].map((x) => (
                        <li key={x} className="flex gap-2">
                            <Icon name="checkCircle" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" /> {x}
                        </li>
                    ))}
                </ul>
            </div>

            <Callout type="info" title="Menus can look slightly different">
                <p>
                    LinkedIn, Meta and Google redesign their websites often. If a button has a slightly different name or sits somewhere else,
                    look for the closest match. The steps and the order stay the same.
                </p>
            </Callout>

            <Callout type="tip" title="What goes where, at a glance">
                <PasteMap
                    rows={[
                        ['LinkedIn → Client ID, Client Secret', 'Settings → LinkedIn'],
                        ['Meta → App ID, App Secret', 'Settings → Meta (Facebook & Instagram)'],
                        ['Google → Client ID, Client secret', 'Settings → Google (YouTube)'],
                        ['Redirect address (shown in Settings)', 'Pasted INTO the LinkedIn / Meta / Google website'],
                    ]}
                />
            </Callout>
        </Section>
    );
}

/* -------------------------------------------------------------------------- */

function LinkedInGuide({ redirects }) {
    return (
        <Section title="Connect LinkedIn" subtitle="You will post on your personal LinkedIn profile. Time needed: about 15 minutes.">
            <Words>
                <p>
                    LinkedIn asks every app to belong to a <b>LinkedIn Page</b> (a company page). Do not worry: it can be a simple placeholder page
                    that nobody ever sees. Posts will still go to <b>your own profile</b>.
                </p>
            </Words>

            <Steps group="linkedin">
                <Step title="Open the LinkedIn Developer website and sign in">
                    <p>
                        Go to <Ext href="https://www.linkedin.com/developers/apps">linkedin.com/developers/apps</Ext> and sign in with the same LinkedIn
                        account you want to post from.
                    </p>
                </Step>

                <Step title="Make a LinkedIn Page (only if you do not have one)">
                    <p>
                        Open <Ext href="https://www.linkedin.com/company/setup/new/">linkedin.com/company/setup/new</Ext>, choose <UI>Company</UI>, type any
                        name (for example your own name or “My Scheduler”), tick the agreement box and press <UI>Create page</UI>.
                    </p>
                    <Callout type="tip">
                        <p>If you already manage any LinkedIn Page, just use that one and skip this step.</p>
                    </Callout>
                </Step>

                <Step title="Create the app">
                    <p>
                        On the developer page press <UI>Create app</UI> and fill in:
                    </p>
                    <ul className="list-disc space-y-1 ps-5">
                        <li>
                            <b>App name:</b> anything, for example <Val>My Post Scheduler</Val>
                        </li>
                        <li>
                            <b>LinkedIn Page:</b> click the box and pick the page from the previous step
                        </li>
                        <li>
                            <b>Privacy policy URL:</b> leave empty
                        </li>
                        <li>
                            <b>App logo:</b> upload any picture (a square image, at least 100×100)
                        </li>
                    </ul>
                    <p>
                        Tick <UI>I have read and agree to these terms</UI> and press <UI>Create app</UI>.
                    </p>
                </Step>

                <Step title="Verify the app with your Page (if LinkedIn asks)">
                    <p>
                        Open the <UI>Settings</UI> tab of your new app. If you see a <UI>Verify</UI> button next to your Page, press it, then{' '}
                        <UI>Generate URL</UI>, open that link in a new tab and press <UI>Approve verification</UI>. Because you own the page, you are the
                        one who approves.
                    </p>
                </Step>

                <Step title="Switch on the two permissions the tool needs">
                    <p>
                        Open the <UI>Products</UI> tab. Find these two and press <UI>Request access</UI> on each, then agree to the terms:
                    </p>
                    <ul className="list-disc space-y-1 ps-5">
                        <li>
                            <UI>Share on LinkedIn</UI> (lets the tool publish posts)
                        </li>
                        <li>
                            <UI>Sign In with LinkedIn using OpenID Connect</UI> (lets you log in and connect)
                        </li>
                    </ul>
                    <p>These two are normally approved straight away. Wait until both say <b>Added</b> or <b>Approved</b>.</p>
                    <Callout type="warn">
                        <p>If you skip this step, connecting will fail with a message about a “scope” or “unauthorized”.</p>
                    </Callout>
                </Step>

                <Step title="Copy your Client ID and Client Secret">
                    <p>
                        Open the <UI>Auth</UI> tab. Under <b>Application credentials</b> you will see:
                    </p>
                    <ul className="list-disc space-y-1 ps-5">
                        <li>
                            <b>Client ID</b>: a short code. Copy it.
                        </li>
                        <li>
                            <b>Primary Client Secret</b>: hidden with dots. Click the little <b>eye</b> icon to show it, then copy it.
                        </li>
                    </ul>
                    <p>Keep this tab open, you will come back to it in the next step.</p>
                </Step>

                <Step title="Tell LinkedIn where to send you back (Redirect URI)">
                    <p>
                        Still on the <UI>Auth</UI> tab, scroll to <b>OAuth 2.0 settings</b>. Next to <b>Authorized redirect URLs for your app</b> click
                        the <b>pencil</b> icon, press <UI>Add redirect URL</UI>, paste the address below, then press <UI>Update</UI>.
                    </p>
                    <RedirectBox value={redirects.linkedin} what="LinkedIn" />
                </Step>

                <Step title="Paste the two codes into this tool">
                    <p>
                        Open <GoSettings />, find the <b>LinkedIn</b> box, paste the <b>Client ID</b> and the <b>Client Secret</b>, and press{' '}
                        <UI>Save settings</UI>. A green “saved” tag appears.
                    </p>
                </Step>

                <Step title="Press Connect">
                    <p>
                        Open <GoConnections />, press <UI>Connect / reconnect</UI> on the LinkedIn card. LinkedIn opens; press <UI>Allow</UI>. You come
                        back here and your name appears as <b>Connected</b>.
                    </p>
                </Step>
            </Steps>

            <Callout type="info" title="Things to remember about LinkedIn">
                <ul className="list-disc space-y-1 ps-5">
                    <li>The connection lasts about <b>60 days</b>. This tool will show a yellow warning on the Dashboard; just press <UI>Reconnect</UI>.</li>
                    <li>Only your <b>personal profile</b> is supported, not company pages.</li>
                </ul>
            </Callout>
        </Section>
    );
}

/* -------------------------------------------------------------------------- */

function MetaGuide({ redirects }) {
    return (
        <Section
            title="Connect Facebook Page & Instagram"
            subtitle="One Meta app covers both. Time needed: about 25 minutes (most of it is getting Instagram ready)."
        >
            <Words>
                <p>
                    You cannot post to a personal Facebook <i>profile</i>. You post to a <b>Facebook Page</b> (a public page like a business or brand
                    page). Instagram posting works only for <b>Business or Creator</b> Instagram accounts that are <b>linked to a Facebook Page</b>. Part A
                    below gets those ready. If you only want Facebook, skip the Instagram parts.
                </p>
            </Words>

            <h3 className="font-semibold text-slate-900">Part A. Get your accounts ready</h3>
            <Steps group="meta-a">
                <Step title="Make sure you have a Facebook Page">
                    <p>
                        Open <Ext href="https://www.facebook.com/pages/create">facebook.com/pages/create</Ext>, give it a name and category, and create
                        it. You must be the <b>admin</b> of the page (the person who creates it is).
                    </p>
                </Step>
                <Step title="Switch your Instagram to a Business or Creator account (for Instagram posting)">
                    <p>On your phone, in the Instagram app:</p>
                    <ol className="list-decimal space-y-1 ps-5">
                        <li>
                            Go to your profile → tap the <b>menu (☰)</b> → <UI>Settings and privacy</UI>.
                        </li>
                        <li>
                            Find <UI>Account type and tools</UI> → <UI>Switch to professional account</UI>.
                        </li>
                        <li>
                            Choose <UI>Creator</UI> or <UI>Business</UI> (either works) and finish the short questions.
                        </li>
                    </ol>
                </Step>
                <Step title="Link Instagram to your Facebook Page">
                    <p>
                        In the Instagram app: <UI>Edit profile</UI> → <UI>Page</UI> (under Public business information) → <UI>Connect an existing Page</UI>{' '}
                        and pick your Page. Log in to Facebook if asked.
                    </p>
                    <Callout type="tip">
                        <p>
                            Alternative on a computer: open your Facebook Page → <UI>Settings</UI> → <UI>Linked accounts</UI> → <UI>Instagram</UI> →{' '}
                            <UI>Connect account</UI>.
                        </p>
                    </Callout>
                </Step>
            </Steps>

            <h3 className="pt-2 font-semibold text-slate-900">Part B. Create the Meta app</h3>
            <Steps group="meta-b">
                <Step title="Open Meta for Developers and register">
                    <p>
                        Go to <Ext href="https://developers.facebook.com/apps">developers.facebook.com/apps</Ext> and log in with the Facebook account that
                        manages your Page. The first time, press <UI>Get started</UI> and follow the short steps (confirm your email or phone, choose a role
                        such as “Developer”).
                    </p>
                </Step>
                <Step title="Create the app">
                    <ol className="list-decimal space-y-1 ps-5">
                        <li>
                            Press <UI>Create app</UI>.
                        </li>
                        <li>
                            App name: anything, for example <Val>My Post Scheduler</Val>. Enter your email. Press <UI>Next</UI>.
                        </li>
                        <li>
                            For the use case, choose <UI>Other</UI> (if offered) and then the app type <UI>Business</UI>. If you only see a list of use
                            cases, pick the one about <b>“Authenticate and request data from users with Facebook Login”</b>.
                        </li>
                        <li>
                            Press <UI>Create app</UI> (Facebook may ask for your password).
                        </li>
                    </ol>
                </Step>
                <Step title="Add “Facebook Login”">
                    <p>
                        In the app dashboard find <UI>Add product</UI> (or <UI>Use cases</UI> → <UI>Customize</UI>), choose <UI>Facebook Login</UI> and
                        press <UI>Set up</UI>. If it asks for a platform, choose <UI>Web</UI> and just press <UI>Continue/Skip</UI> through the quickstart:
                        you do not need to enter anything there.
                    </p>
                </Step>
                <Step title="Tell Facebook where to send you back (Redirect URI)">
                    <p>
                        In the left menu open <UI>Facebook Login</UI> → <UI>Settings</UI>. In the box <b>Valid OAuth Redirect URIs</b> paste the address
                        below and press <UI>Save changes</UI> at the bottom.
                    </p>
                    <RedirectBox value={redirects.facebook} what="Facebook / Instagram" />
                    <p>
                        On the same page make sure <UI>Client OAuth login</UI> and <UI>Web OAuth login</UI> are switched <b>on</b> (they normally are).
                    </p>
                </Step>
                <Step title="Copy the App ID and App Secret">
                    <p>
                        In the left menu open <UI>App settings</UI> → <UI>Basic</UI>. You will see:
                    </p>
                    <ul className="list-disc space-y-1 ps-5">
                        <li>
                            <b>App ID</b>: copy it.
                        </li>
                        <li>
                            <b>App secret</b>: press <UI>Show</UI> (Facebook asks for your password), then copy it.
                        </li>
                    </ul>
                </Step>
                <Step title="Keep the app in Development mode">
                    <Callout type="danger" title="Do NOT switch the app to “Live”">
                        <p>
                            At the top of the Meta dashboard there is a switch showing <b>Development</b>. Leave it there. In Development mode the app works
                            fully for <b>you</b> (the owner) with no review. Going “Live” would force a long review process you do not need.
                        </p>
                    </Callout>
                </Step>
                <Step title="Paste the codes into this tool">
                    <p>
                        Open <GoSettings />, find the box <b>Meta · Facebook Page & Instagram</b>, paste <b>App ID</b> and <b>App Secret</b>, and press{' '}
                        <UI>Save settings</UI>.
                    </p>
                </Step>
                <Step title="Press Connect and choose your Page and Instagram">
                    <ol className="list-decimal space-y-1 ps-5">
                        <li>
                            Open <GoConnections /> and press <UI>Connect / reconnect</UI> on the <b>Facebook & Instagram</b> card.
                        </li>
                        <li>
                            Facebook opens. Press <UI>Continue as (your name)</UI>.
                        </li>
                        <li>
                            When it asks which <b>Pages</b> to allow, choose <UI>Opt in to current Pages only</UI> (or select your page) and press{' '}
                            <UI>Next</UI>. If it asks for <b>Instagram accounts</b>, select yours too.
                        </li>
                        <li>
                            Press <UI>Save</UI> / <UI>Done</UI>.
                        </li>
                    </ol>
                    <p>
                        You come back to this tool and see your Facebook Page (and your Instagram account, if linked) in the list as <b>Connected</b>.
                    </p>
                </Step>
            </Steps>

            <Callout type="warn" title="Instagram needs one more thing">
                <p>
                    Instagram downloads your picture from the internet before posting it, so it needs a <b>public web link</b> to your files. On a normal
                    computer at home this does not exist yet. See the tab <b>“Instagram public link”</b> (takes 5 minutes), or skip it when this tool
                    is running on your real website.
                </p>
            </Callout>
        </Section>
    );
}

/* -------------------------------------------------------------------------- */

function YouTubeGuide({ redirects }) {
    return (
        <Section title="Connect YouTube" subtitle="Time needed: about 20 minutes. Google’s website has the most steps, but all of them are simple.">
            <Words>
                <p>
                    Google calls the “app” a <b>project</b>. You make a free project, switch on the <b>YouTube Data API</b> inside it, then create the
                    Client ID and Secret. You need a Google account that already has a <b>YouTube channel</b> (open{' '}
                    <Ext href="https://www.youtube.com">youtube.com</Ext> and click your profile picture → <UI>Create a channel</UI> if you have none).
                </p>
            </Words>

            <Steps group="youtube">
                <Step title="Open Google Cloud Console">
                    <p>
                        Go to <Ext href="https://console.cloud.google.com">console.cloud.google.com</Ext> and sign in with the Google account that owns
                        your YouTube channel. If it asks you to agree to terms, tick the box and press <UI>Agree and continue</UI>. You do <b>not</b>{' '}
                        need to add a credit card.
                    </p>
                </Step>

                <Step title="Create a project">
                    <p>
                        At the very top, next to the Google Cloud logo, click the <b>project selector</b> (it may say “Select a project”). Press{' '}
                        <UI>New project</UI>, type a name like <Val>Post Scheduler</Val> and press <UI>Create</UI>. Wait a few seconds, then make sure
                        your new project is selected at the top.
                    </p>
                </Step>

                <Step title="Switch on the YouTube Data API v3">
                    <ol className="list-decimal space-y-1 ps-5">
                        <li>
                            Open the menu (☰) → <UI>APIs & Services</UI> → <UI>Library</UI>.
                        </li>
                        <li>
                            In the search box type <Val>YouTube Data API v3</Val> and click the result.
                        </li>
                        <li>
                            Press the blue <UI>Enable</UI> button.
                        </li>
                    </ol>
                </Step>

                <Step title="Set up the consent screen (what you will see when you press Allow)">
                    <p>
                        Open ☰ → <UI>APIs & Services</UI> → <UI>OAuth consent screen</UI> (in newer Google pages this is called{' '}
                        <UI>Google Auth Platform</UI>; press <UI>Get started</UI>). Fill in:
                    </p>
                    <ul className="list-disc space-y-1 ps-5">
                        <li>
                            <b>App name:</b> <Val>Post Scheduler</Val>
                        </li>
                        <li>
                            <b>User support email:</b> pick your email from the list
                        </li>
                        <li>
                            <b>Audience / User type:</b> choose <UI>External</UI>
                        </li>
                        <li>
                            <b>Contact email:</b> your email
                        </li>
                    </ul>
                    <p>
                        Agree to the policy and press <UI>Create</UI> (or <UI>Save and continue</UI> on each page).
                    </p>
                </Step>

                <Step title="Allow the two YouTube permissions">
                    <p>
                        Find <UI>Data access</UI> (older pages: the <UI>Scopes</UI> step) and press <UI>Add or remove scopes</UI>. In the filter type{' '}
                        <Val>YouTube</Val> and tick these two:
                    </p>
                    <ul className="list-disc space-y-1 ps-5">
                        <li>
                            <Val>…/auth/youtube.upload</Val> (“Manage your YouTube videos”)
                        </li>
                        <li>
                            <Val>…/auth/youtube.readonly</Val> (“View your YouTube account”)
                        </li>
                    </ul>
                    <p>
                        Press <UI>Update</UI>, then <UI>Save</UI>.
                    </p>
                </Step>

                <Step title="Add yourself, then publish the app">
                    <ol className="list-decimal space-y-2 ps-5">
                        <li>
                            Open <UI>Audience</UI> (older pages: <UI>Test users</UI>) → <UI>Add users</UI> → type your own Gmail address → <UI>Save</UI>.
                        </li>
                        <li>
                            On the same <UI>Audience</UI> page press <UI>Publish app</UI> and confirm. The status changes from “Testing” to{' '}
                            <b>“In production”</b>.
                        </li>
                    </ol>
                    <Callout type="warn" title="Do not skip “Publish app”">
                        <p>
                            If the app stays in “Testing”, Google disconnects your YouTube after <b>7 days</b> and you must reconnect every week. Publishing
                            is free and instant for personal use. You do not need to submit it for Google’s review.
                        </p>
                    </Callout>
                </Step>

                <Step title="Create the Client ID and Client Secret">
                    <ol className="list-decimal space-y-1 ps-5">
                        <li>
                            Open ☰ → <UI>APIs & Services</UI> → <UI>Credentials</UI>.
                        </li>
                        <li>
                            Press <UI>+ Create credentials</UI> → <UI>OAuth client ID</UI>.
                        </li>
                        <li>
                            <b>Application type:</b> choose <UI>Web application</UI>. Name: <Val>Post Scheduler</Val>.
                        </li>
                        <li>
                            Scroll to <b>Authorized redirect URIs</b>, press <UI>+ Add URI</UI> and paste the address below.
                        </li>
                        <li>
                            Press <UI>Create</UI>.
                        </li>
                    </ol>
                    <RedirectBox value={redirects.youtube} what="YouTube" />
                    <p>
                        A window appears with your <b>Client ID</b> and <b>Client secret</b>. <b>Copy both now</b> and keep them safe. Google may not show
                        the secret again later (if that happens, just create a new one).
                    </p>
                </Step>

                <Step title="Paste the codes into this tool">
                    <p>
                        Open <GoSettings />, find <b>Google · YouTube</b>, paste <b>Client ID</b> and <b>Client Secret</b>, press <UI>Save settings</UI>.
                    </p>
                </Step>

                <Step title="Press Connect and allow access">
                    <ol className="list-decimal space-y-1 ps-5">
                        <li>
                            Open <GoConnections /> and press <UI>Connect / reconnect</UI> on the <b>YouTube</b> card.
                        </li>
                        <li>Pick the Google account that owns the channel.</li>
                        <li>
                            Google shows <b>“Google hasn’t verified this app”</b>. This is normal because you made the app yourself. Press{' '}
                            <UI>Advanced</UI> → <UI>Go to Post Scheduler (unsafe)</UI>.
                        </li>
                        <li>
                            <b>Tick both permission boxes</b>, then press <UI>Continue</UI>.
                        </li>
                        <li>If it asks which channel, choose the one you want to post to.</li>
                    </ol>
                </Step>
            </Steps>

            <Callout type="info" title="Good to know about YouTube">
                <ul className="list-disc space-y-1 ps-5">
                    <li>
                        Google’s free limit is about <b>6 video uploads per day</b>.
                    </li>
                    <li>
                        New personal apps may be forced to upload as <b>Private</b> until Google reviews the app. If that happens this tool shows a note on
                        the post. You can still make the video public by hand inside YouTube Studio.
                    </li>
                    <li>YouTube posts need a <b>video</b>. Text-only posts are not possible.</li>
                </ul>
            </Callout>
        </Section>
    );
}

/* -------------------------------------------------------------------------- */

function PublicGuide({ isLocal, publicBaseUrl, appUrl }) {
    return (
        <Section
            title="Instagram needs a public link"
            subtitle="Only needed for Instagram, and only while this tool runs on your own computer."
        >
            <Words>
                <p>
                    When you post a picture on Instagram through this tool, <b>Instagram’s own computers download the picture from the internet</b>. A
                    tool running on your own computer (“localhost”) is invisible to the internet, so Instagram cannot find the picture. We solve this by
                    giving your computer a temporary public address.
                </p>
            </Words>

            {isLocal ? (
                <Callout type="warn" title="You are running on your own computer right now">
                    <p>
                        This tool’s address is <Val>{appUrl}</Val>. Instagram will <b>not</b> work until you finish the steps below. Facebook, LinkedIn and
                        YouTube are not affected.
                    </p>
                </Callout>
            ) : (
                <Callout type="tip" title="Good news: you are already on a public address">
                    <p>
                        This tool runs at <Val>{appUrl}</Val>, which the internet can reach. You can skip this page. Just leave “Public base URL” empty in
                        Settings.
                    </p>
                </Callout>
            )}

            {publicBaseUrl && (
                <Callout type="info" title="A public base URL is currently saved">
                    <CopyField value={publicBaseUrl} />
                </Callout>
            )}

            <h3 className="font-semibold text-slate-900">Option A (easiest to understand): use a free tunnel called ngrok</h3>
            <Steps group="public">
                <Step title="Create a free ngrok account and install it">
                    <p>
                        Go to <Ext href="https://ngrok.com/download">ngrok.com/download</Ext>, sign up (free), download the Windows version, unzip it,
                        and follow the one-time “connect your account” command shown on their page (it looks like{' '}
                        <Val>ngrok config add-authtoken …</Val>).
                    </p>
                </Step>
                <Step title="Start the tunnel">
                    <p>
                        Keep this tool running. Open a new Command Prompt window and type the command below, then press Enter:
                    </p>
                    <CopyField value="ngrok http 8000" />
                    <p>
                        ngrok shows a line like <Val>Forwarding https://abcd-1234.ngrok-free.app → http://localhost:8000</Val>. Copy the{' '}
                        <b>https://…ngrok-free.app</b> address. Leave that window open.
                    </p>
                </Step>
                <Step title="Paste it into Settings">
                    <p>
                        Open <GoSettings />, find <b>General</b> → <b>Public base URL</b>, paste the address (no slash at the end) and press{' '}
                        <UI>Save settings</UI>.
                    </p>
                </Step>
                <Step title="Post to Instagram">
                    <p>
                        Create a post with an image (JPG) or a video, tick your Instagram account and press <UI>Schedule post</UI> or{' '}
                        <UI>Publish now</UI>. Keep ngrok running until the post is published.
                    </p>
                </Step>
            </Steps>

            <Callout type="info" title="Notes">
                <ul className="list-disc space-y-1 ps-5">
                    <li>
                        With the free plan the ngrok address <b>changes every time</b> you restart it. Paste the new one into Settings each time.
                    </li>
                    <li>
                        For posts scheduled for later, ngrok must be running at the scheduled time. The permanent fix is to put this tool on your real website
                        (next tab).
                    </li>
                    <li>
                        Instagram accepts <b>JPG</b> pictures only (not PNG), and videos are posted as Reels.
                    </li>
                </ul>
            </Callout>
        </Section>
    );
}

/* -------------------------------------------------------------------------- */

function LiveGuide({ redirects }) {
    return (
        <Section
            title="Put it on your real website (cPanel hosting)"
            subtitle="Do this when everything works on your computer and you want posts to publish even when your PC is off."
        >
            <Words>
                <p>
                    Moving the tool to your hosting changes the web address, so the <b>Redirect URI</b> changes too. LinkedIn, Meta and Google only accept
                    addresses you registered, so you must add the new one in each of them. Your Client IDs and Secrets stay the same.
                </p>
            </Words>

            <Steps group="live">
                <Step title="Upload the tool and set it up on the host">
                    <p>
                        The technical hosting steps (upload, database, <Val>.env</Val>, “Document root”, cron job) are written step by step in the{' '}
                        <b>README.md</b> file inside the project folder, under <b>“Deploying to cPanel”</b>. Give that section to whoever manages your hosting.
                        The most important part is the <b>cron job</b>: without it, scheduled posts will not be published.
                    </p>
                </Step>
                <Step title="Find your new Redirect URIs">
                    <p>
                        After the tool is live, log in on your real website, open this guide again and copy the addresses below. They automatically use
                        your new website address.
                    </p>
                    <div className="space-y-3">
                        <CopyField label="LinkedIn" value={redirects.linkedin} />
                        <CopyField label="Facebook / Instagram (Meta)" value={redirects.facebook} />
                        <CopyField label="YouTube (Google)" value={redirects.youtube} />
                        <CopyField label="Threads" value={redirects.threads} />
                        <CopyField label="X (Twitter)" value={redirects.x} />
                    </div>
                </Step>
                <Step title="Add them on each platform (do not delete the old ones)">
                    <ul className="list-disc space-y-1.5 ps-5">
                        <li>
                            <b>LinkedIn:</b> developer page → your app → <UI>Auth</UI> → pencil next to <b>Authorized redirect URLs</b> → <UI>Add redirect URL</UI>.
                        </li>
                        <li>
                            <b>Meta:</b> your app → <UI>Facebook Login</UI> → <UI>Settings</UI> → <b>Valid OAuth Redirect URIs</b> → add on a new line → <UI>Save changes</UI>.
                        </li>
                        <li>
                            <b>Google:</b> Cloud Console → <UI>APIs & Services</UI> → <UI>Credentials</UI> → click your OAuth client → <b>Authorized redirect URIs</b> → <UI>+ Add URI</UI> → <UI>Save</UI>.
                        </li>
                    </ul>
                </Step>
                <Step title="Enter your Settings again on the live site">
                    <p>
                        The live website has its own empty database, so open <GoSettings /> there and paste the Client IDs and Secrets once more, then press{' '}
                        <UI>Connect</UI> on each platform again. Leave <b>Public base URL</b> empty (Instagram will use your website address).
                    </p>
                </Step>
              <Step title="Change the default password">
                    <p>
                        Before going live, open <b>Profile</b> and set a strong login password. An easy password lets anyone on the internet post to your social accounts.
                    </p>
                </Step>
            </Steps>
        </Section>
    );
}

/* -------------------------------------------------------------------------- */

function FixGuide() {
    return (
        <Section title="Something went wrong?" subtitle="Find your message below. Open it to see the fix.">
            <Faq
                items={[
                    [
                        'The Connect button says “Add credentials first”',
                        <p key="a">
                            You have not saved the Client ID / Secret yet. Open <GoSettings />, paste them in the right box and press <UI>Save settings</UI>.
                        </p>,
                    ],
                    [
                        '“Redirect URI mismatch”, “redirect_uri_mismatch” or “URL blocked: the redirect URI is not whitelisted”',
                        <>
                            <p>
                                The address you registered on the platform is not exactly the same as the one this tool uses. Common mistakes: extra space,
                                a slash at the end, <Val>http</Val> instead of <Val>https</Val>, or <Val>localhost</Val> instead of <Val>127.0.0.1</Val>.
                            </p>
                            <p>
                                Open <GoSettings /> and use the <UI>Copy</UI> button next to the redirect address of that platform, then paste it again in
                                the platform’s website. Open the tool using the same address every time (for example always <Val>localhost:8000</Val>).
                            </p>
                        </>,
                    ],
                    [
                        'LinkedIn: “unauthorized_scope_error” or “scope is not authorized”',
                        <p key="a">
                            The two LinkedIn products are not active yet. On the LinkedIn developer page open your app → <UI>Products</UI> and check that{' '}
                            <UI>Share on LinkedIn</UI> and <UI>Sign In with LinkedIn using OpenID Connect</UI> both say Added/Approved. Then press Connect
                            again.
                        </p>,
                    ],
                    [
                        'Google: “Access blocked: this app has not completed the verification process” or “Error 403: access_denied”',
                        <p key="a">
                            In Google Cloud Console → <UI>OAuth consent screen / Audience</UI>, either add your Gmail under <b>Test users</b> or press{' '}
                            <UI>Publish app</UI>. Then try again and use <UI>Advanced</UI> → <UI>Go to … (unsafe)</UI>.
                        </p>,
                    ],
                    [
                        'Google: it connected, but stops working after about a week',
                        <p key="a">
                            Your Google app is still in “Testing”. Open the consent screen → <UI>Audience</UI> → <UI>Publish app</UI>, then reconnect YouTube
                            once.
                        </p>,
                    ],
                    [
                        'Facebook: “No Facebook Pages were returned”',
                        <ul key="a" className="list-disc space-y-1 ps-5">
                            <li>You must be an <b>admin</b> of the Page.</li>
                            <li>
                                On the Facebook permission screen, make sure you <b>selected your Page</b> (not “none”). Press Connect again and tick it.
                            </li>
                            <li>Make sure you logged in to the Facebook account that manages the Page.</li>
                        </ul>,
                    ],
                    [
                        'Instagram account does not appear after connecting Facebook',
                        <ul key="a" className="list-disc space-y-1 ps-5">
                            <li>The Instagram account must be a <b>Business or Creator</b> account (not personal).</li>
                            <li>It must be <b>linked to the same Facebook Page</b> you selected.</li>
                            <li>
                                On the Facebook permission screen, also select the Instagram account. Fix those, then press <UI>Connect / reconnect</UI> on
                                the Facebook & Instagram card again.
                            </li>
                        </ul>,
                    ],
                    [
                        'Instagram says the media is not public / mentions PUBLIC_BASE_URL',
                        <p key="a">
                            Instagram cannot reach your computer. Follow the tab <b>“Instagram public link”</b>, or run the tool on your real website.
                        </p>,
                    ],
                    [
                        'A post shows “Failed” with a red message',
                        <p key="a">
                            Read the message under the platform name. It says what to change (for example “caption too long” or “Instagram needs an image”).
                            Fix the post with <UI>Edit</UI> if needed, then press <UI>Retry</UI>.
                        </p>,
                    ],
                    [
                        'An account says “Needs reconnect”',
                        <p key="a">
                            The permission expired or was removed. Open <GoConnections /> and press <UI>Reconnect</UI> on that account. It takes 10 seconds.
                            LinkedIn needs this about every 60 days.
                        </p>,
                    ],
                    [
                        'My YouTube video became Private',
                        <p key="a">
                            Google keeps videos from new personal apps private until the app is reviewed. Open YouTube Studio → <UI>Content</UI> → change
                            the video to <b>Public</b> by hand. Uploads still work.
                        </p>,
                    ],
                    [
                        'Posts do not go out at the scheduled time',
                        <ul key="a" className="list-disc space-y-1 ps-5">
                            <li>
                                <b>On your computer:</b> the scheduler window must be running (the black window started with <Val>php artisan schedule:work</Val>)
                                and the computer must be on.
                            </li>
                            <li>
                                <b>On your hosting:</b> the cron job (“every minute”) must be set up in cPanel. See the README.
                            </li>
                            <li>
                                Check the time zone in <GoSettings /> (General → Display timezone).
                            </li>
                        </ul>,
                    ],
                ]}
            />
        </Section>
    );
}

/* -------------------------------------------------------------------------- */

export default function Index({ tab, appUrl, isLocal, redirects, publicBaseUrl }) {
    const [active, setActiveState] = useState(TABS.some((t) => t.id === tab) ? tab : 'start');
    const [lang, setLangState] = useState(() => {
        try {
            const q = new URLSearchParams(window.location.search).get('lang');
            if (q === 'en' || q === 'bn') return q;
            return localStorage.getItem('jop-guide-lang') || 'bn';
        } catch {
            return 'bn';
        }
    });

    const setLang = (l) => {
        setLangState(l);
        try {
            localStorage.setItem('jop-guide-lang', l);
        } catch {
            /* ignore */
        }
    };

    const setTab = (id) => {
        setActiveState(id);
        try {
            window.history.replaceState(null, '', route('guide', { tab: id }));
        } catch {
            /* ignore */
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const bn = lang === 'bn';
    const content = {
        start: bn ? <StartHereBn setTab={setTab} /> : <StartHere setTab={setTab} />,
        linkedin: bn ? <LinkedInBn redirects={redirects} /> : <LinkedInGuide redirects={redirects} />,
        meta: bn ? <MetaBn redirects={redirects} /> : <MetaGuide redirects={redirects} />,
        youtube: bn ? <YouTubeBn redirects={redirects} /> : <YouTubeGuide redirects={redirects} />,
        threads: bn ? <ThreadsBn redirects={redirects} /> : <ThreadsEn redirects={redirects} />,
        x: bn ? <XBn redirects={redirects} /> : <XEn redirects={redirects} />,
        telegram: bn ? <TelegramBn /> : <TelegramEn />,
        discord: bn ? <DiscordBn /> : <DiscordEn />,
        wordpress: bn ? <WordPressBn /> : <WordPressEn />,
        more: bn ? <MoreBn /> : <MoreEn />,
        public: bn ? (
            <PublicBn isLocal={isLocal} publicBaseUrl={publicBaseUrl} appUrl={appUrl} />
        ) : (
            <PublicGuide isLocal={isLocal} publicBaseUrl={publicBaseUrl} appUrl={appUrl} />
        ),
        live: bn ? <LiveBn redirects={redirects} /> : <LiveGuide redirects={redirects} />,
        fix: bn ? <FixBn /> : <FixGuide />,
    }[active];

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title={bn ? 'সেটআপ গাইড' : 'Setup guide'}
                    subtitle={
                        bn
                            ? 'প্রতিটি প্ল্যাটফর্ম কানেক্ট করার ধাপে ধাপে সাহায্য। কোনো টেকনিক্যাল জ্ঞান লাগবে না।'
                            : 'Step-by-step help for connecting each platform. No technical knowledge needed.'
                    }
                    actions={
                        <div className="inline-flex rounded-xl bg-slate-200/70 p-1 text-sm font-medium">
                            {[
                                ['bn', 'বাংলা'],
                                ['en', 'English'],
                            ].map(([code, label]) => (
                                <button
                                    key={code}
                                    onClick={() => setLang(code)}
                                    className={
                                        'rounded-lg px-3.5 py-1.5 transition ' +
                                        (lang === code ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900')
                                    }
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    }
                />
            }
        >
            <Head title={bn ? 'সেটআপ গাইড' : 'Setup guide'} />

            <LangContext.Provider value={lang}>
                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
                    <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:sticky lg:top-6 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
                        {TABS.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={
                                    'flex shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition ' +
                                    (active === t.id
                                        ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                                        : 'text-slate-600 hover:bg-white/70')
                                }
                            >
                                <span className="flex h-6 w-6 items-center justify-center text-slate-500">{t.icon}</span>
                                {t[lang]}
                            </button>
                        ))}
                    </nav>

                    <div className="card min-w-0 p-5 sm:p-8">{content}</div>
                </div>
            </LangContext.Provider>
        </AuthenticatedLayout>
    );
}
