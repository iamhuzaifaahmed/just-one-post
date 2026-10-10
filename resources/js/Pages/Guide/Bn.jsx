import CopyField from '@/Components/CopyField';
import {
    Callout,
    Ext,
    Faq,
    GoConnections,
    GoSettings,
    PasteMap,
    RedirectBox,
    Section,
    Step,
    Steps,
    UI,
    Val,
    Words,
} from '@/Components/GuideParts';
import Icon from '@/Components/Icon';
import PlatformIcon from '@/Components/PlatformIcon';

/* বাংলা গাইড: বোতাম ও মেনুর নাম ইংরেজিতেই রাখা হয়েছে, কারণ LinkedIn/Meta/Google-এর ওয়েবসাইটে সেগুলো ইংরেজিতেই দেখাবে। */

export function StartHereBn({ setTab }) {
    return (
        <Section title="এখান থেকে শুরু করুন" subtitle="একবার পড়ে নিন। মাত্র ২ মিনিট লাগবে, পরের সব কাজ সহজ হয়ে যাবে।">
            <Words>
                <p>
                    LinkedIn, Facebook, Instagram আর YouTube-এ <b>আপনার হয়ে পোস্ট করতে</b> এই টুলকে প্রত্যেকের কাছ থেকে অনুমতি নিতে হয়।
                    সেই অনুমতি পাওয়ার জন্য প্রতিটি ওয়েবসাইটের ডেভেলপার পেজে <b>আপনি নিজেই একটি “অ্যাপ”</b> বানাবেন। এটা সম্পূর্ণ ফ্রি, আর
                    আসলে শুধু একটা ফর্ম পূরণ করা।
                </p>
                <p className="mt-2">
                    অ্যাপ বানানো শেষ হলে প্রতিটি থেকে দুটি কোড পাবেন: <b>Client ID</b> (ইউজারনেমের মতো) আর <b>Client Secret</b> (পাসওয়ার্ডের
                    মতো)। এই কোড দুটি এই টুলের <GoSettings /> পেজে পেস্ট করবেন, তারপর <GoConnections /> পেজে <UI>Connect</UI> চাপবেন। ব্যস, কাজ শেষ।
                </p>
            </Words>

            <div>
                <h3 className="mb-3 font-semibold text-fg">প্রতিটি প্ল্যাটফর্মের জন্য ৩টি ধাপ</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {[
                        ['১', 'অ্যাপ বানান', 'প্ল্যাটফর্মের ডেভেলপার ওয়েবসাইটে। প্রতিটি ক্লিক এই গাইডে দেখানো আছে।'],
                        ['২', '২টি কোড Settings-এ দিন', 'Client ID আর Client Secret। আর একটা ঠিকানা (Redirect URI) উল্টো দিকে, মানে ওদের সাইটে বসাবেন।'],
                        ['৩', 'Connect চাপুন', 'নিজের অ্যাকাউন্টে লগইন করে Allow চাপুন। হয়ে গেল। আর করতে হবে না (শুধু LinkedIn প্রতি ~৬০ দিনে একবার)।'],
                    ].map(([n, t, d]) => (
                        <div key={n} className="card p-4">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-fg">{n}</span>
                            <div className="mt-3 font-semibold text-fg">{t}</div>
                            <p className="mt-1 text-sm text-muted">{d}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="mb-3 font-semibold text-fg">আপনার যেটা দরকার সেটা বেছে নিন</h3>
                <p className="mb-3 text-sm text-muted">সবকিছু সেটআপ করা বাধ্যতামূলক নয়। যে প্ল্যাটফর্মে পোস্ট করতে চান শুধু সেটাই করুন।</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                        ['linkedin', ['linkedin'], 'LinkedIn', 'আপনার নিজের প্রোফাইলে পোস্ট।', 'প্রায় ১৫ মিনিট'],
                        ['meta', ['facebook', 'instagram'], 'Facebook Page ও Instagram', 'Facebook Page লাগবে। Instagram অবশ্যই Business বা Creator অ্যাকাউন্ট হতে হবে।', 'প্রায় ২৫ মিনিট'],
                        ['youtube', ['youtube'], 'YouTube', 'আপনার চ্যানেলে ভিডিও আপলোড।', 'প্রায় ২০ মিনিট'],
                        ['threads', ['threads'], 'Threads', 'লেখা, ছবি ও ভিডিও পোস্ট। Meta ডেভেলপার অ্যাপ লাগবে।', 'প্রায় ২০ মিনিট'],
                        ['x', ['x'], 'X (Twitter)', 'ডেভেলপার অ্যাপ ও ক্রেডিট লাগবে (X প্রতি পোস্টে টাকা নেয়)।', 'প্রায় ২৫ মিনিট'],
                        ['telegram', ['telegram'], 'Telegram', 'নিজের বট দিয়ে চ্যানেল বা গ্রুপে পোস্ট। ডেভেলপার অ্যাপ লাগে না।', 'প্রায় ১০ মিনিট'],
                        ['discord', ['discord'], 'Discord', 'webhook লিংক দিয়ে চ্যানেলে পোস্ট। সবচেয়ে সহজ।', 'প্রায় ৩ মিনিট'],
                        ['wordpress', ['wordpress'], 'WordPress', 'Application Password দিয়ে ব্লগ পোস্ট প্রকাশ।', 'প্রায় ৫ মিনিট'],
                    ].map(([id, icons, t, d, time]) => (
                        <button
                            key={id}
                            onClick={() => setTab(id)}
                            className="card flex items-center gap-4 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
                        >
                            <span className="flex -space-x-2">
                                {icons.map((i) => (
                                    <PlatformIcon key={i} platform={i} size="lg" className="ring-4 ring-panel" />
                                ))}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block font-semibold text-fg">{t}</span>
                                <span className="block text-sm text-muted">{d}</span>
                            </span>
                            <span className="shrink-0 rounded-full bg-soft px-2.5 py-1 text-xs font-medium text-muted">{time}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="mb-3 font-semibold text-fg">শুরুর আগে এগুলো হাতের কাছে রাখুন</h3>
                <ul className="space-y-2 text-sm text-fg/80">
                    {[
                        'যে অ্যাকাউন্টগুলোতে পোস্ট করতে চান, সেগুলোতে লগইন করার তথ্য (ইমেইল/পাসওয়ার্ড)।',
                        'পাশে ফোন রাখুন: কিছু সাইট লগইনের সময় SMS বা ইমেইলে কোড পাঠায়।',
                        'প্রতিটি প্ল্যাটফর্মের জন্য প্রথমবার প্রায় ২০ মিনিট সময়।',
                        'কোডগুলো নিরাপদে রাখার জায়গা (পাসওয়ার্ড ম্যানেজার বা প্রাইভেট নোট)। Client Secret কখনো কারও সাথে শেয়ার করবেন না, কোথাও পাবলিকলি পোস্টও করবেন না।',
                    ].map((x) => (
                        <li key={x} className="flex gap-2">
                            <Icon name="checkCircle" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" /> {x}
                        </li>
                    ))}
                </ul>
            </div>

            <Callout type="info" title="মেনুর চেহারা একটু আলাদা হতে পারে">
                <p>
                    LinkedIn, Meta আর Google প্রায়ই তাদের ওয়েবসাইটের ডিজাইন বদলায়। কোনো বোতামের নাম একটু আলাদা হলে বা অন্য জায়গায় থাকলে, সবচেয়ে কাছাকাছি
                    নামটা খুঁজে নিন। ধাপগুলো আর ক্রম একই থাকে।
                </p>
            </Callout>

            <Callout type="tip" title="কোন কোড কোথায় যাবে, এক নজরে">
                <PasteMap
                    rows={[
                        ['LinkedIn → Client ID, Client Secret', 'Settings → LinkedIn'],
                        ['Meta → App ID, App Secret', 'Settings → Meta (Facebook ও Instagram)'],
                        ['Google → Client ID, Client secret', 'Settings → Google (YouTube)'],
                        ['Redirect ঠিকানা (Settings-এ দেখানো আছে)', 'LinkedIn / Meta / Google-এর ওয়েবসাইটে বসাবেন'],
                    ]}
                />
            </Callout>
        </Section>
    );
}

/* -------------------------------------------------------------------------- */

export function LinkedInBn({ redirects }) {
    return (
        <Section title="LinkedIn কানেক্ট করুন" subtitle="আপনার নিজের LinkedIn প্রোফাইলে পোস্ট হবে। সময় লাগবে প্রায় ১৫ মিনিট।">
            <Words>
                <p>
                    LinkedIn চায় প্রতিটি অ্যাপ একটা <b>LinkedIn Page</b>-এর (কোম্পানি পেজ) সাথে যুক্ত থাকুক। চিন্তা নেই: এটা একটা সাধারণ ফাঁকা পেজ হলেও চলবে, যেটা কেউ দেখবেও
                    না। পোস্ট কিন্তু <b>আপনার নিজের প্রোফাইলেই</b> যাবে।
                </p>
            </Words>

            <Steps group="linkedin">
                <Step title="LinkedIn Developer ওয়েবসাইটে গিয়ে লগইন করুন">
                    <p>
                        <Ext href="https://www.linkedin.com/developers/apps">linkedin.com/developers/apps</Ext> এ যান। যে LinkedIn অ্যাকাউন্ট থেকে পোস্ট করতে চান
                        সেটা দিয়েই লগইন করুন।
                    </p>
                </Step>

                <Step title="একটা LinkedIn Page বানান (না থাকলে)">
                    <p>
                        <Ext href="https://www.linkedin.com/company/setup/new/">linkedin.com/company/setup/new</Ext> এ গিয়ে <UI>Company</UI> বেছে নিন। যেকোনো নাম দিন
                        (যেমন আপনার নিজের নাম বা “My Scheduler”), শর্তের বক্সে টিক দিন, তারপর <UI>Create page</UI> চাপুন।
                    </p>
                    <Callout type="tip">
                        <p>আপনি আগে থেকেই কোনো LinkedIn Page চালালে সেটাই ব্যবহার করুন, এই ধাপ বাদ দিন।</p>
                    </Callout>
                </Step>

                <Step title="অ্যাপ বানান">
                    <p>
                        ডেভেলপার পেজে <UI>Create app</UI> চাপুন এবং এভাবে পূরণ করুন:
                    </p>
                    <ul className="list-disc space-y-1 ps-5">
                        <li>
                            <b>App name:</b> যেকোনো নাম, যেমন <Val>My Post Scheduler</Val>
                        </li>
                        <li>
                            <b>LinkedIn Page:</b> বক্সে ক্লিক করে আগের ধাপের পেজটি বেছে নিন
                        </li>
                        <li>
                            <b>Privacy policy URL:</b> ফাঁকা রাখুন
                        </li>
                        <li>
                            <b>App logo:</b> যেকোনো একটা ছবি দিন (চৌকোনা, কমপক্ষে ১০০×১০০)
                        </li>
                    </ul>
                    <p>
                        <UI>I have read and agree to these terms</UI> এ টিক দিয়ে <UI>Create app</UI> চাপুন।
                    </p>
                </Step>

                <Step title="অ্যাপটি আপনার Page দিয়ে ভেরিফাই করুন (LinkedIn চাইলে)">
                    <p>
                        নতুন অ্যাপের <UI>Settings</UI> ট্যাব খুলুন। Page-এর পাশে <UI>Verify</UI> বোতাম থাকলে সেটা চাপুন, তারপর <UI>Generate URL</UI>। যে লিংক আসবে সেটা নতুন
                        ট্যাবে খুলে <UI>Approve verification</UI> চাপুন। পেজটা আপনারই, তাই অনুমোদনটাও আপনিই দেবেন।
                    </p>
                </Step>

                <Step title="টুলের দরকারি দুটি পারমিশন চালু করুন">
                    <p>
                        <UI>Products</UI> ট্যাব খুলুন। নিচের দুটি খুঁজে প্রত্যেকটায় <UI>Request access</UI> চাপুন এবং শর্তে সম্মতি দিন:
                    </p>
                    <ul className="list-disc space-y-1 ps-5">
                        <li>
                            <UI>Share on LinkedIn</UI> (এটা দিয়ে টুল পোস্ট করতে পারে)
                        </li>
                        <li>
                            <UI>Sign In with LinkedIn using OpenID Connect</UI> (এটা দিয়ে আপনি লগইন করে কানেক্ট করতে পারেন)
                        </li>
                    </ul>
                    <p>এই দুটি সাধারণত সাথে সাথেই অনুমোদন হয়ে যায়। দুটোতেই <b>Added</b> বা <b>Approved</b> না দেখা পর্যন্ত অপেক্ষা করুন।</p>
                    <Callout type="warn">
                        <p>এই ধাপ বাদ দিলে কানেক্ট করার সময় “scope” বা “unauthorized” সম্পর্কিত এরর আসবে।</p>
                    </Callout>
                </Step>

                <Step title="Client ID আর Client Secret কপি করুন">
                    <p>
                        <UI>Auth</UI> ট্যাব খুলুন। <b>Application credentials</b> এর নিচে দেখবেন:
                    </p>
                    <ul className="list-disc space-y-1 ps-5">
                        <li>
                            <b>Client ID</b>: ছোট একটা কোড। কপি করুন।
                        </li>
                        <li>
                            <b>Primary Client Secret</b>: ডট ডট দিয়ে লুকানো। পাশের <b>চোখের (eye)</b> আইকনে ক্লিক করে দেখুন, তারপর কপি করুন।
                        </li>
                    </ul>
                    <p>এই ট্যাব খোলা রাখুন, পরের ধাপে আবার লাগবে।</p>
                </Step>

                <Step title="LinkedIn-কে জানান ফেরত কোথায় পাঠাবে (Redirect URI)">
                    <p>
                        একই <UI>Auth</UI> ট্যাবে নিচে নামুন, <b>OAuth 2.0 settings</b> অংশে। <b>Authorized redirect URLs for your app</b> এর পাশের <b>পেন্সিল</b> আইকনে
                        ক্লিক করুন, <UI>Add redirect URL</UI> চাপুন, নিচের ঠিকানাটা পেস্ট করুন, তারপর <UI>Update</UI> চাপুন।
                    </p>
                    <RedirectBox value={redirects.linkedin} what="LinkedIn" />
                </Step>

                <Step title="কোড দুটি এই টুলে পেস্ট করুন">
                    <p>
                        <GoSettings /> পেজ খুলুন, <b>LinkedIn</b> বক্স খুঁজে <b>Client ID</b> আর <b>Client Secret</b> পেস্ট করুন, তারপর <UI>Save settings</UI> চাপুন। সবুজ
                        “saved” লেখা দেখা যাবে।
                    </p>
                </Step>

                <Step title="Connect চাপুন">
                    <p>
                        <GoConnections /> পেজে LinkedIn কার্ডে <UI>Connect / reconnect</UI> চাপুন। LinkedIn খুলবে, <UI>Allow</UI> চাপুন। আপনি এই টুলে ফিরে আসবেন এবং আপনার নাম
                        <b> Connected</b> অবস্থায় দেখাবে।
                    </p>
                </Step>
            </Steps>

            <Callout type="info" title="LinkedIn নিয়ে মনে রাখার কথা">
                <ul className="list-disc space-y-1 ps-5">
                    <li>
                        কানেকশন প্রায় <b>৬০ দিন</b> থাকে। মেয়াদ শেষ হওয়ার আগে ড্যাশবোর্ডে হলুদ সতর্কতা আসবে, শুধু <UI>Reconnect</UI> চাপলেই হবে।
                    </li>
                    <li>শুধু আপনার <b>ব্যক্তিগত প্রোফাইলে</b> পোস্ট হবে, কোম্পানি পেজে নয়।</li>
                </ul>
            </Callout>
        </Section>
    );
}

/* -------------------------------------------------------------------------- */

export function MetaBn({ redirects }) {
    return (
        <Section
            title="Facebook Page ও Instagram কানেক্ট করুন"
            subtitle="একটি Meta অ্যাপ দিয়েই দুটো হয়ে যায়। সময় লাগবে প্রায় ২৫ মিনিট (বেশিরভাগ সময় যায় Instagram প্রস্তুত করতে)।"
        >
            <Words>
                <p>
                    ব্যক্তিগত Facebook <i>প্রোফাইলে</i> এই টুল দিয়ে পোস্ট করা যায় না। পোস্ট যায় <b>Facebook Page</b>-এ (ব্যবসা বা ব্র্যান্ডের পাবলিক পেজ)। আর Instagram-এ
                    পোস্ট করতে হলে অ্যাকাউন্টটি <b>Business বা Creator</b> হতে হবে এবং একটি <b>Facebook Page-এর সাথে যুক্ত</b> থাকতে হবে। নিচের “ক অংশে” সেগুলো ঠিক করা হবে।
                    শুধু Facebook চাইলে Instagram-এর ধাপগুলো বাদ দিন।
                </p>
            </Words>

            <h3 className="font-semibold text-fg">ক অংশ: অ্যাকাউন্ট প্রস্তুত করুন</h3>
            <Steps group="meta-a">
                <Step title="একটা Facebook Page আছে কি না দেখুন">
                    <p>
                        না থাকলে <Ext href="https://www.facebook.com/pages/create">facebook.com/pages/create</Ext> এ গিয়ে নাম আর ক্যাটাগরি দিয়ে বানান। পেজের <b>অ্যাডমিন</b> আপনাকেই
                        হতে হবে (যিনি বানান তিনি স্বাভাবিকভাবেই অ্যাডমিন)।
                    </p>
                </Step>
                <Step title="Instagram-কে Business বা Creator অ্যাকাউন্ট করুন (Instagram পোস্টের জন্য)">
                    <p>ফোনে Instagram অ্যাপে:</p>
                    <ol className="list-decimal space-y-1 ps-5">
                        <li>
                            প্রোফাইলে যান → <b>মেনু (☰)</b> চাপুন → <UI>Settings and privacy</UI>।
                        </li>
                        <li>
                            <UI>Account type and tools</UI> খুঁজুন → <UI>Switch to professional account</UI>।
                        </li>
                        <li>
                            <UI>Creator</UI> বা <UI>Business</UI> বেছে নিন (যেকোনোটা চলবে) এবং ছোট প্রশ্নগুলোর উত্তর দিয়ে শেষ করুন।
                        </li>
                    </ol>
                </Step>
                <Step title="Instagram-কে আপনার Facebook Page-এর সাথে যুক্ত করুন">
                    <p>
                        Instagram অ্যাপে: <UI>Edit profile</UI> → <UI>Page</UI> (Public business information-এর নিচে) → <UI>Connect an existing Page</UI> এবং আপনার পেজ বেছে নিন।
                        চাইলে Facebook-এ লগইন করুন।
                    </p>
                    <Callout type="tip">
                        <p>
                            কম্পিউটারে বিকল্প: Facebook Page খুলুন → <UI>Settings</UI> → <UI>Linked accounts</UI> → <UI>Instagram</UI> → <UI>Connect account</UI>।
                        </p>
                    </Callout>
                </Step>
            </Steps>

            <h3 className="pt-2 font-semibold text-fg">খ অংশ: Meta অ্যাপ বানান</h3>
            <Steps group="meta-b">
                <Step title="Meta for Developers-এ গিয়ে রেজিস্টার করুন">
                    <p>
                        <Ext href="https://developers.facebook.com/apps">developers.facebook.com/apps</Ext> এ যান এবং যে Facebook অ্যাকাউন্ট দিয়ে পেজ চালান তা দিয়ে লগইন করুন। প্রথমবার
                        <UI>Get started</UI> চেপে ছোট ধাপগুলো শেষ করুন (ইমেইল বা ফোন কনফার্ম করুন, “Developer” রোল বেছে নিন)।
                    </p>
                </Step>
                <Step title="অ্যাপ তৈরি করুন">
                    <ol className="list-decimal space-y-1 ps-5">
                        <li>
                            <UI>Create app</UI> চাপুন।
                        </li>
                        <li>
                            App name: যেকোনো নাম, যেমন <Val>My Post Scheduler</Val>। আপনার ইমেইল দিন। <UI>Next</UI> চাপুন।
                        </li>
                        <li>
                            Use case-এর জায়গায় <UI>Other</UI> থাকলে সেটা বেছে নিন, তারপর অ্যাপ টাইপ <UI>Business</UI>। যদি শুধু একটা তালিকা দেখায়, তাহলে <b>“Authenticate and request data from users with Facebook Login”</b>
                            সম্পর্কিতটা বেছে নিন।
                        </li>
                        <li>
                            <UI>Create app</UI> চাপুন (Facebook পাসওয়ার্ড চাইতে পারে)।
                        </li>
                    </ol>
                </Step>
                <Step title="“Facebook Login” যোগ করুন">
                    <p>
                        অ্যাপ ড্যাশবোর্ডে <UI>Add product</UI> (বা <UI>Use cases</UI> → <UI>Customize</UI>) খুঁজুন, <UI>Facebook Login</UI> বেছে <UI>Set up</UI> চাপুন। প্ল্যাটফর্ম চাইলে{' '}
                        <UI>Web</UI> বেছে নিন এবং কুইকস্টার্টের ধাপগুলো <UI>Continue/Skip</UI> চেপে এড়িয়ে যান। ওখানে কিছু লিখতে হবে না।
                    </p>
                </Step>
                <Step title="Facebook-কে জানান ফেরত কোথায় পাঠাবে (Redirect URI)">
                    <p>
                        বাঁ দিকের মেনু থেকে <UI>Facebook Login</UI> → <UI>Settings</UI> খুলুন। <b>Valid OAuth Redirect URIs</b> বক্সে নিচের ঠিকানা পেস্ট করুন এবং নিচে{' '}
                        <UI>Save changes</UI> চাপুন।
                    </p>
                    <RedirectBox value={redirects.facebook} what="Facebook / Instagram" />
                    <p>
                        একই পেজে <UI>Client OAuth login</UI> আর <UI>Web OAuth login</UI> <b>চালু (on)</b> আছে কি না দেখুন (সাধারণত থাকেই)।
                    </p>
                </Step>
                <Step title="App ID আর App Secret কপি করুন">
                    <p>
                        বাঁ মেনু থেকে <UI>App settings</UI> → <UI>Basic</UI> খুলুন। দেখবেন:
                    </p>
                    <ul className="list-disc space-y-1 ps-5">
                        <li>
                            <b>App ID</b>: কপি করুন।
                        </li>
                        <li>
                            <b>App secret</b>: <UI>Show</UI> চাপুন (Facebook পাসওয়ার্ড চাইবে), তারপর কপি করুন।
                        </li>
                    </ul>
                </Step>
                <Step title="অ্যাপ Development mode-এই রেখে দিন">
                    <Callout type="danger" title="অ্যাপকে “Live” করবেন না">
                        <p>
                            Meta ড্যাশবোর্ডের উপরে একটা সুইচ আছে যেখানে <b>Development</b> লেখা। ওটা যেমন আছে তেমনই রাখুন। Development mode-এ অ্যাপ <b>আপনার</b> (মালিকের) জন্য
                            পুরোপুরি কাজ করে, কোনো রিভিউ লাগে না। “Live” করলে দীর্ঘ রিভিউ প্রক্রিয়া শুরু হবে, যার কোনো দরকার নেই।
                        </p>
                    </Callout>
                </Step>
                <Step title="কোড দুটি এই টুলে পেস্ট করুন">
                    <p>
                        <GoSettings /> খুলে <b>Meta · Facebook Page & Instagram</b> বক্সে <b>App ID</b> আর <b>App Secret</b> পেস্ট করুন, তারপর <UI>Save settings</UI> চাপুন।
                    </p>
                </Step>
                <Step title="Connect চাপুন এবং আপনার Page ও Instagram বেছে নিন">
                    <ol className="list-decimal space-y-1 ps-5">
                        <li>
                            <GoConnections /> পেজে <b>Facebook & Instagram</b> কার্ডে <UI>Connect / reconnect</UI> চাপুন।
                        </li>
                        <li>
                            Facebook খুলবে। <UI>Continue as (আপনার নাম)</UI> চাপুন।
                        </li>
                        <li>
                            কোন <b>Page</b>-এ অনুমতি দেবেন জিজ্ঞেস করলে <UI>Opt in to current Pages only</UI> বেছে নিন (বা আপনার পেজটা সিলেক্ট করুন) এবং <UI>Next</UI> চাপুন। <b>Instagram
                            accounts</b> চাইলে আপনারটাও সিলেক্ট করুন।
                        </li>
                        <li>
                            <UI>Save</UI> / <UI>Done</UI> চাপুন।
                        </li>
                    </ol>
                    <p>
                        আপনি এই টুলে ফিরে আসবেন এবং আপনার Facebook Page (আর যুক্ত থাকলে Instagram অ্যাকাউন্ট) <b>Connected</b> অবস্থায় তালিকায় দেখাবে।
                    </p>
                </Step>
            </Steps>

            <Callout type="warn" title="Instagram-এর জন্য আরেকটা জিনিস দরকার">
                <p>
                    Instagram পোস্ট করার আগে ইন্টারনেট থেকে আপনার ছবিটা নামিয়ে নেয়, তাই ফাইলগুলোর জন্য একটা <b>পাবলিক ওয়েব লিংক</b> লাগে। বাসার কম্পিউটারে এটা সাধারণত থাকে না।
                    <b> “Instagram পাবলিক লিংক”</b> ট্যাব দেখুন (৫ মিনিটের কাজ)। টুলটি আপনার আসল ওয়েবসাইটে চালু থাকলে এটা লাগবে না।
                </p>
            </Callout>
        </Section>
    );
}

/* -------------------------------------------------------------------------- */

export function YouTubeBn({ redirects }) {
    return (
        <Section title="YouTube কানেক্ট করুন" subtitle="সময় লাগবে প্রায় ২০ মিনিট। Google-এর ওয়েবসাইটে ধাপ একটু বেশি, তবে প্রতিটি ধাপই সহজ।">
            <Words>
                <p>
                    Google “অ্যাপ”-কে বলে <b>project</b>। আপনি একটা ফ্রি project বানাবেন, তার ভেতরে <b>YouTube Data API</b> চালু করবেন, তারপর Client ID আর Secret তৈরি করবেন।
                    যে Google অ্যাকাউন্টে আপনার <b>YouTube চ্যানেল</b> আছে সেটাই লাগবে (চ্যানেল না থাকলে <Ext href="https://www.youtube.com">youtube.com</Ext>-এ প্রোফাইল ছবিতে
                    ক্লিক করে <UI>Create a channel</UI> চাপুন)।
                </p>
            </Words>

            <Steps group="youtube">
                <Step title="Google Cloud Console খুলুন">
                    <p>
                        <Ext href="https://console.cloud.google.com">console.cloud.google.com</Ext> এ যান এবং আপনার YouTube চ্যানেলের Google অ্যাকাউন্ট দিয়ে লগইন করুন। শর্তে সম্মতি
                        চাইলে টিক দিয়ে <UI>Agree and continue</UI> চাপুন। ক্রেডিট কার্ড দিতে হবে <b>না</b>।
                    </p>
                </Step>

                <Step title="একটা project বানান">
                    <p>
                        একদম উপরে Google Cloud লোগোর পাশে <b>project selector</b> আছে (হয়তো “Select a project” লেখা)। ওখানে ক্লিক করে <UI>New project</UI> চাপুন, নাম দিন{' '}
                        <Val>Post Scheduler</Val> এবং <UI>Create</UI> চাপুন। কয়েক সেকেন্ড অপেক্ষা করুন, তারপর উপরে আপনার নতুন project সিলেক্ট করা আছে কি না দেখে নিন।
                    </p>
                </Step>

                <Step title="YouTube Data API v3 চালু করুন">
                    <ol className="list-decimal space-y-1 ps-5">
                        <li>
                            মেনু (☰) → <UI>APIs & Services</UI> → <UI>Library</UI> খুলুন।
                        </li>
                        <li>
                            সার্চ বক্সে <Val>YouTube Data API v3</Val> লিখে রেজাল্টে ক্লিক করুন।
                        </li>
                        <li>
                            নীল <UI>Enable</UI> বোতাম চাপুন।
                        </li>
                    </ol>
                </Step>

                <Step title="Consent screen সেট করুন (Allow চাপার সময় যা দেখবেন)">
                    <p>
                        ☰ → <UI>APIs & Services</UI> → <UI>OAuth consent screen</UI> খুলুন (নতুন Google পেজে এর নাম <UI>Google Auth Platform</UI>; <UI>Get started</UI> চাপুন)। পূরণ করুন:
                    </p>
                    <ul className="list-disc space-y-1 ps-5">
                        <li>
                            <b>App name:</b> <Val>Post Scheduler</Val>
                        </li>
                        <li>
                            <b>User support email:</b> তালিকা থেকে আপনার ইমেইল বেছে নিন
                        </li>
                        <li>
                            <b>Audience / User type:</b> <UI>External</UI> বেছে নিন
                        </li>
                        <li>
                            <b>Contact email:</b> আপনার ইমেইল
                        </li>
                    </ul>
                    <p>
                        নীতিতে সম্মতি দিয়ে <UI>Create</UI> চাপুন (বা প্রতি পেজে <UI>Save and continue</UI>)।
                    </p>
                </Step>

                <Step title="YouTube-এর দুটি পারমিশন যোগ করুন">
                    <p>
                        <UI>Data access</UI> (পুরনো পেজে <UI>Scopes</UI> ধাপ) খুঁজে <UI>Add or remove scopes</UI> চাপুন। ফিল্টারে <Val>YouTube</Val> লিখে এই দুটোতে টিক দিন:
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
                        <UI>Update</UI> চাপুন, তারপর <UI>Save</UI>।
                    </p>
                </Step>

                <Step title="নিজেকে যোগ করুন, তারপর অ্যাপ Publish করুন">
                    <ol className="list-decimal space-y-2 ps-5">
                        <li>
                            <UI>Audience</UI> (পুরনো পেজে <UI>Test users</UI>) খুলুন → <UI>Add users</UI> → নিজের Gmail ঠিকানা লিখুন → <UI>Save</UI>।
                        </li>
                        <li>
                            একই <UI>Audience</UI> পেজে <UI>Publish app</UI> চাপুন এবং নিশ্চিত করুন। স্ট্যাটাস “Testing” থেকে <b>“In production”</b> হয়ে যাবে।
                        </li>
                    </ol>
                    <Callout type="warn" title="“Publish app” বাদ দেবেন না">
                        <p>
                            অ্যাপ “Testing”-এ থেকে গেলে Google <b>৭ দিন</b> পর আপনার YouTube কানেকশন কেটে দেয়, প্রতি সপ্তাহে আবার কানেক্ট করতে হবে। Publish করা ফ্রি এবং ব্যক্তিগত ব্যবহারের জন্য সাথে সাথে হয়ে
                            যায়। Google-এর রিভিউয়ের জন্য জমা দিতে হবে না।
                        </p>
                    </Callout>
                </Step>

                <Step title="Client ID আর Client Secret তৈরি করুন">
                    <ol className="list-decimal space-y-1 ps-5">
                        <li>
                            ☰ → <UI>APIs & Services</UI> → <UI>Credentials</UI> খুলুন।
                        </li>
                        <li>
                            <UI>+ Create credentials</UI> → <UI>OAuth client ID</UI> চাপুন।
                        </li>
                        <li>
                            <b>Application type:</b> <UI>Web application</UI> বেছে নিন। নাম: <Val>Post Scheduler</Val>।
                        </li>
                        <li>
                            নিচে <b>Authorized redirect URIs</b> অংশে <UI>+ Add URI</UI> চেপে নিচের ঠিকানা পেস্ট করুন।
                        </li>
                        <li>
                            <UI>Create</UI> চাপুন।
                        </li>
                    </ol>
                    <RedirectBox value={redirects.youtube} what="YouTube" />
                    <p>
                        একটা উইন্ডোতে আপনার <b>Client ID</b> আর <b>Client secret</b> দেখাবে। <b>এখনই দুটো কপি করে</b> নিরাপদে রেখে দিন। Google পরে secret আবার নাও দেখাতে পারে (সেক্ষেত্রে নতুন একটা
                        বানিয়ে নিন)।
                    </p>
                </Step>

                <Step title="কোড দুটি এই টুলে পেস্ট করুন">
                    <p>
                        <GoSettings /> খুলে <b>Google · YouTube</b> বক্সে <b>Client ID</b> আর <b>Client Secret</b> পেস্ট করুন, <UI>Save settings</UI> চাপুন।
                    </p>
                </Step>

                <Step title="Connect চাপুন এবং অনুমতি দিন">
                    <ol className="list-decimal space-y-1 ps-5">
                        <li>
                            <GoConnections /> পেজে <b>YouTube</b> কার্ডে <UI>Connect / reconnect</UI> চাপুন।
                        </li>
                        <li>যে Google অ্যাকাউন্টে চ্যানেল আছে সেটা বেছে নিন।</li>
                        <li>
                            Google দেখাবে <b>“Google hasn’t verified this app”</b>। এটা স্বাভাবিক, কারণ অ্যাপটা আপনি নিজে বানিয়েছেন। <UI>Advanced</UI> → <UI>Go to Post Scheduler (unsafe)</UI> চাপুন।
                        </li>
                        <li>
                            <b>দুটি পারমিশন বক্সেই টিক দিন</b>, তারপর <UI>Continue</UI> চাপুন।
                        </li>
                        <li>কোন চ্যানেল চাইলে যেটাতে পোস্ট করতে চান সেটা বেছে নিন।</li>
                    </ol>
                </Step>
            </Steps>

            <Callout type="info" title="YouTube নিয়ে জেনে রাখুন">
                <ul className="list-disc space-y-1 ps-5">
                    <li>
                        Google-এর ফ্রি সীমা দিনে প্রায় <b>৬টি ভিডিও আপলোড</b>।
                    </li>
                    <li>
                        নতুন ব্যক্তিগত অ্যাপের ভিডিও Google রিভিউ না করা পর্যন্ত <b>Private</b> হয়ে যেতে পারে। তখন টুল পোস্টের নিচে একটা নোট দেখাবে। YouTube Studio থেকে ভিডিওটা হাতে করে Public করে নিতে পারবেন।
                    </li>
                    <li>YouTube-এর জন্য <b>ভিডিও</b> লাগবে। শুধু লেখা দিয়ে পোস্ট হয় না।</li>
                </ul>
            </Callout>
        </Section>
    );
}

/* -------------------------------------------------------------------------- */

export function PublicBn({ isLocal, publicBaseUrl, appUrl }) {
    return (
        <Section title="Instagram-এর জন্য পাবলিক লিংক" subtitle="শুধু Instagram-এর জন্য দরকার, আর শুধু তখনই যখন টুলটি আপনার নিজের কম্পিউটারে চলছে।">
            <Words>
                <p>
                    এই টুল দিয়ে Instagram-এ ছবি পোস্ট করলে <b>Instagram-এর নিজস্ব কম্পিউটার ইন্টারনেট থেকে ছবিটা নামিয়ে নেয়</b>। আপনার নিজের কম্পিউটারে (“localhost”) চলা টুল ইন্টারনেট থেকে দেখা
                    যায় না, তাই Instagram ছবিটা খুঁজে পায় না। সমাধান: আপনার কম্পিউটারকে সাময়িকভাবে একটা পাবলিক ঠিকানা দেওয়া।
                </p>
            </Words>

            {isLocal ? (
                <Callout type="warn" title="এখন আপনি নিজের কম্পিউটারে চালাচ্ছেন">
                    <p>
                        এই টুলের ঠিকানা এখন <Val>{appUrl}</Val>। নিচের ধাপগুলো শেষ না করা পর্যন্ত Instagram কাজ <b>করবে না</b>। Facebook, LinkedIn আর YouTube-এ কোনো সমস্যা নেই।
                    </p>
                </Callout>
            ) : (
                <Callout type="tip" title="ভালো খবর: আপনি আগে থেকেই পাবলিক ঠিকানায় আছেন">
                    <p>
                        এই টুল চলছে <Val>{appUrl}</Val> ঠিকানায়, যা ইন্টারনেট থেকে পাওয়া যায়। এই পেজ বাদ দিতে পারেন। Settings-এ “Public base URL” ফাঁকা রাখুন।
                    </p>
                </Callout>
            )}

            {publicBaseUrl && (
                <Callout type="info" title="একটি Public base URL এখন সেভ করা আছে">
                    <CopyField value={publicBaseUrl} />
                </Callout>
            )}

            <h3 className="font-semibold text-fg">উপায় ক (সবচেয়ে সহজ): ngrok নামের ফ্রি টানেল</h3>
            <Steps group="public">
                <Step title="ফ্রি ngrok অ্যাকাউন্ট খুলে ইনস্টল করুন">
                    <p>
                        <Ext href="https://ngrok.com/download">ngrok.com/download</Ext> এ গিয়ে সাইন আপ করুন (ফ্রি), Windows ভার্সন ডাউনলোড ও unzip করুন, আর তাদের পেজে দেখানো একবারের “connect your
                        account” কমান্ডটি চালান (দেখতে এমন: <Val>ngrok config add-authtoken …</Val>)।
                    </p>
                </Step>
                <Step title="টানেল চালু করুন">
                    <p>এই টুল চালু রাখুন। নতুন একটা Command Prompt উইন্ডো খুলে নিচের কমান্ড লিখে Enter চাপুন:</p>
                    <CopyField value="ngrok http 8000" />
                    <p>
                        ngrok এমন একটা লাইন দেখাবে: <Val>Forwarding https://abcd-1234.ngrok-free.app → http://localhost:8000</Val>। এর মধ্যে <b>https://…ngrok-free.app</b> ঠিকানাটা কপি করুন। ওই উইন্ডো খোলা
                        রাখুন।
                    </p>
                </Step>
                <Step title="Settings-এ পেস্ট করুন">
                    <p>
                        <GoSettings /> খুলে <b>General</b> → <b>Public base URL</b>-এ ঠিকানাটা পেস্ট করুন (শেষে স্ল্যাশ ছাড়া) এবং <UI>Save settings</UI> চাপুন।
                    </p>
                </Step>
                <Step title="Instagram-এ পোস্ট করুন">
                    <p>
                        ছবি (JPG) বা ভিডিও দিয়ে একটা পোস্ট বানান, আপনার Instagram অ্যাকাউন্টে টিক দিন এবং <UI>Schedule post</UI> বা <UI>Publish now</UI> চাপুন। পোস্ট না হওয়া পর্যন্ত ngrok চালু রাখুন।
                    </p>
                </Step>
            </Steps>

            <Callout type="info" title="কিছু কথা">
                <ul className="list-disc space-y-1 ps-5">
                    <li>
                        ফ্রি প্ল্যানে ngrok ঠিকানা প্রতিবার রিস্টার্ট করলে <b>বদলে যায়</b>। প্রতিবার নতুনটা Settings-এ পেস্ট করতে হবে।
                    </li>
                    <li> ভবিষ্যতের জন্য শিডিউল করা পোস্টের সময়ও ngrok চালু থাকতে হবে।
                    </li>
                    <li>
                        Instagram শুধু <b>JPG</b> ছবি নেয় (PNG নয়), আর ভিডিও Reel হিসেবে পোস্ট হয়।
                    </li>
                </ul>
            </Callout>
        </Section>
    );
}

/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */

export function FixBn() {
    return (
        <Section title="কিছু ঠিকমতো কাজ করছে না?" subtitle="নিচে আপনার এররটা খুঁজে ক্লিক করুন, সমাধান দেখতে পাবেন।">
            <Faq
                items={[
                    [
                        'Connect বোতামের জায়গায় “Add credentials first” লেখা',
                        <p key="a">
                            আপনি এখনো Client ID / Secret সেভ করেননি। <GoSettings /> খুলে সঠিক বক্সে পেস্ট করে <UI>Save settings</UI> চাপুন।
                        </p>,
                    ],
                    [
                        '“Redirect URI mismatch”, “redirect_uri_mismatch” বা “URL blocked: the redirect URI is not whitelisted”',
                        <>
                            <p>
                                প্ল্যাটফর্মে আপনি যে ঠিকানা দিয়েছেন সেটা এই টুলের ঠিকানার সাথে হুবহু মেলেনি। সাধারণ ভুল: বাড়তি স্পেস, শেষে স্ল্যাশ (/), <Val>https</Val>-এর জায়গায় <Val>http</Val>, বা{' '}
                                <Val>localhost</Val>-এর জায়গায় <Val>127.0.0.1</Val>।
                            </p>
                            <p>
                                <GoSettings /> খুলে ওই প্ল্যাটফর্মের Redirect ঠিকানার পাশের <UI>Copy</UI> বোতাম চেপে কপি করুন এবং প্ল্যাটফর্মের সাইটে আবার পেস্ট করুন। টুল সবসময় একই ঠিকানায় খুলুন (যেমন সবসময়
                                <Val> localhost:8000</Val>)।
                            </p>
                        </>,
                    ],
                    [
                        'LinkedIn: “unauthorized_scope_error” বা “scope is not authorized”',
                        <p key="a">
                            LinkedIn-এর দুটি প্রোডাক্ট এখনো চালু হয়নি। LinkedIn ডেভেলপার পেজে আপনার অ্যাপ → <UI>Products</UI> খুলে দেখুন <UI>Share on LinkedIn</UI> আর{' '}
                            <UI>Sign In with LinkedIn using OpenID Connect</UI> দুটোতেই Added/Approved আছে কি না। তারপর আবার Connect চাপুন।
                        </p>,
                    ],
                    [
                        'Google: “Access blocked: this app has not completed the verification process” বা “Error 403: access_denied”',
                        <p key="a">
                            Google Cloud Console → <UI>OAuth consent screen / Audience</UI> এ গিয়ে <b>Test users</b>-এ আপনার Gmail যোগ করুন, অথবা <UI>Publish app</UI> চাপুন। তারপর আবার চেষ্টা করুন এবং{' '}
                            <UI>Advanced</UI> → <UI>Go to … (unsafe)</UI> চাপুন।
                        </p>,
                    ],
                    [
                        'Google: কানেক্ট হয়েছিল, কিন্তু প্রায় এক সপ্তাহ পর কাজ করছে না',
                        <p key="a">
                            আপনার Google অ্যাপ এখনো “Testing” অবস্থায় আছে। Consent screen → <UI>Audience</UI> → <UI>Publish app</UI> চাপুন, তারপর একবার YouTube আবার কানেক্ট করুন।
                        </p>,
                    ],
                    [
                        'Facebook: “No Facebook Pages were returned”',
                        <ul key="a" className="list-disc space-y-1 ps-5">
                            <li>পেজের <b>অ্যাডমিন</b> আপনাকেই হতে হবে।</li>
                            <li>
                                Facebook-এর পারমিশন স্ক্রিনে আপনার <b>পেজটা সিলেক্ট করেছেন</b> কি না দেখুন (“none” নয়)। আবার Connect চেপে টিক দিন।
                            </li>
                            <li>যে Facebook অ্যাকাউন্ট দিয়ে পেজ চালান সেটা দিয়েই লগইন করেছেন কি না দেখুন।</li>
                        </ul>,
                    ],
                    [
                        'Facebook কানেক্ট করার পরও Instagram অ্যাকাউন্ট দেখা যাচ্ছে না',
                        <ul key="a" className="list-disc space-y-1 ps-5">
                            <li>Instagram অ্যাকাউন্ট অবশ্যই <b>Business বা Creator</b> হতে হবে (ব্যক্তিগত নয়)।</li>
                            <li>এটি আপনি যে <b>Facebook Page</b> সিলেক্ট করেছেন সেটার সাথে <b>যুক্ত</b> থাকতে হবে।</li>
                            <li>
                                Facebook-এর পারমিশন স্ক্রিনে Instagram অ্যাকাউন্টটিও সিলেক্ট করুন। এগুলো ঠিক করে Facebook & Instagram কার্ডে আবার <UI>Connect / reconnect</UI> চাপুন।
                            </li>
                        </ul>,
                    ],
                    [
                        'Instagram বলছে মিডিয়া পাবলিক নয় / PUBLIC_BASE_URL-এর কথা বলছে',
                        <p key="a">
                            Instagram আপনার কম্পিউটারে পৌঁছাতে পারছে না। <b>“Instagram পাবলিক লিংক”</b> ট্যাবের ধাপগুলো অনুসরণ করুন, অথবা অ্যাডমিনকে জানান।
                        </p>,
                    ],
                    [
                        'কোনো পোস্টে লাল “Failed” আর একটা মেসেজ দেখাচ্ছে',
                        <p key="a">
                            প্ল্যাটফর্মের নামের নিচের মেসেজটা পড়ুন। কী বদলাতে হবে সেখানেই লেখা আছে (যেমন “caption too long” বা “Instagram needs an image”)। দরকার হলে <UI>Edit</UI> দিয়ে পোস্ট ঠিক
                            করে <UI>Retry</UI> চাপুন।
                        </p>,
                    ],
                    [
                        'কোনো অ্যাকাউন্টে “Needs reconnect” লেখা',
                        <p key="a">
                            অনুমতির মেয়াদ শেষ হয়েছে বা তুলে নেওয়া হয়েছে। <GoConnections /> পেজে ওই অ্যাকাউন্টে <UI>Reconnect</UI> চাপুন। ১০ সেকেন্ডের কাজ। LinkedIn-এ প্রায় প্রতি ৬০ দিনে এটা লাগে।
                        </p>,
                    ],
                    [
                        'আমার YouTube ভিডিও Private হয়ে গেছে',
                        <p key="a">
                            নতুন ব্যক্তিগত অ্যাপের ভিডিও Google রিভিউ না হওয়া পর্যন্ত Private রাখে। YouTube Studio → <UI>Content</UI> এ গিয়ে ভিডিওটা হাতে করে <b>Public</b> করে নিন। আপলোড ঠিকই কাজ করছে।
                        </p>,
                    ],
                    [
                        'ঠিক সময়ে পোস্ট হচ্ছে না',
                        <ul key="a" className="list-disc space-y-1 ps-5">
                            <li>
                                <GoSettings />-এ (General → Display timezone) টাইম জোন ঠিক আছে কি না দেখুন। সময় ওই টাইম জোনেই দিতে হয়।
                            </li>
                            <li>অনেক পোস্ট দেরি হলে অ্যাডমিনকে জানান: সার্ভারের scheduler বন্ধ হয়ে থাকতে পারে।</li>
                        </ul>,
                    ],
                    [
                        'লগইন পাসওয়ার্ড ভুলে গেছি',
                        <p key="a">
                            লগইন পেজে <UI>Forgot password?</UI> চাপুন এবং আপনার ইমেইল দিন, নতুন পাসওয়ার্ড বানানোর লিংক ইমেইলে চলে যাবে। ইমেইল না এলে অ্যাডমিনকে জানান।
                        </p>,
                    ],
                ]}
            />
        </Section>
    );
}
