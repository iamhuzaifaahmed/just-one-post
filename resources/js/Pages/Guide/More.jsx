import { Callout, GoConnections, Section, UI, Words } from '@/Components/GuideParts';
import PlatformIcon from '@/Components/PlatformIcon';

const Card = ({ icons, title, children, wide }) => (
    <div className={'card p-5 ' + (wide ? 'md:col-span-2' : '')}>
        <div className="mb-2 flex items-center gap-2 font-semibold text-fg">
            {icons.map((i) => (
                <PlatformIcon key={i} platform={i} size="sm" />
            ))}
            {title}
        </div>
        {children}
    </div>
);

const OL = ({ children }) => <ol className="list-decimal space-y-2 ps-5 text-sm leading-relaxed text-fg/80">{children}</ol>;

/* ------------------------------ বাংলা ------------------------------ */

export function MoreBn() {
    return (
        <Section
            title="আরও অ্যাকাউন্ট যোগ করুন"
            subtitle="একাধিক Facebook Page, Instagram, LinkedIn প্রোফাইল ও YouTube চ্যানেল: যতগুলো খুশি।"
        >
            <Words>
                <p>
                    <GoConnections /> পেজে প্রতিবার <UI>Connect another account</UI> চাপলে <b>নতুন একটা অ্যাকাউন্ট যোগ হয়</b>। আগেরগুলো মুছে যায় না, বদলেও যায় না। কয়টা অ্যাকাউন্ট যোগ করা
                    যাবে তার কোনো সীমা নেই। নতুন পোস্ট লেখার সময় একসাথে সবগুলোতে (বা বেছে নেওয়া কয়েকটাতে) পোস্ট করতে পারবেন।
                </p>
            </Words>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card icons={['facebook', 'instagram']} title="আরও Facebook Page ও Instagram">
                    <OL>
                        <li>
                            <GoConnections /> পেজে <b>Facebook & Instagram</b> কার্ডে <UI>Connect another account</UI> চাপুন।
                        </li>
                        <li>
                            Facebook-এর উইন্ডোতে “Continue as (আপনার নাম)” এর নিচে বা পাশে <UI>Edit settings</UI> (বা <UI>Edit access</UI>) লিংকে ক্লিক করুন।
                        </li>
                        <li>
                            <b>নতুন Page গুলোতে টিক দিন</b> (আগেরগুলো টিক দেওয়াই থাকবে)। Instagram চাইলে ওগুলোও টিক দিন।
                        </li>
                        <li>
                            <UI>Next</UI> → <UI>Save</UI>। প্রতিটি Page আর তার সাথে যুক্ত Instagram অ্যাকাউন্ট নিজে থেকেই তালিকায় যোগ হবে।
                        </li>
                    </OL>
                    <div className="mt-3">
                        <Callout type="warn" title="অন্য কারো Facebook অ্যাকাউন্টের Page হলে">
                            <p>
                                Meta অ্যাপ <b>Development mode</b>-এ আছে বলে শুধু অ্যাপের <b>Admin / Developer / Tester</b> রা অনুমতি দিতে পারেন। অন্য মানুষের Facebook অ্যাকাউন্ট যোগ করতে:
                                developers.facebook.com → আপনার অ্যাপ → <UI>App roles</UI> → <UI>Roles</UI> → <UI>Add People</UI> → তার Facebook নাম দিয়ে <b>Tester</b> বা <b>Developer</b> বানান। সে
                                নোটিফিকেশনে Accept করার পর তার অ্যাকাউন্ট দিয়ে Connect করতে পারবে।
                            </p>
                        </Callout>
                    </div>
                </Card>

                <Card icons={['linkedin']} title="আরও LinkedIn প্রোফাইল">
                    <OL>
                        <li>
                            LinkedIn সবসময় ব্রাউজারে যে অ্যাকাউন্টে লগইন করা আছে সেটাই ব্যবহার করে। তাই আগে <b>linkedin.com থেকে লগ আউট</b> করুন, অথবা একটা <b>প্রাইভেট / ইনকগনিটো উইন্ডো</b>{' '}
                            খুলুন এবং ওখানে এই টুলে লগইন করুন।
                        </li>
                        <li>
                            <GoConnections /> পেজে LinkedIn কার্ডে <UI>Connect another account</UI> চাপুন।
                        </li>
                        <li>
                            LinkedIn-এ <b>দ্বিতীয় প্রোফাইলের</b> ইমেইল-পাসওয়ার্ড দিয়ে লগইন করে <UI>Allow</UI> চাপুন।
                        </li>
                    </OL>
                    <div className="mt-3">
                        <Callout type="info">
                            <p>অন্য মানুষের প্রোফাইল হলে তাকে নিজেই লগইন করে <UI>Allow</UI> চাপতে হবে। তার পাসওয়ার্ড আপনার জানার দরকার নেই।</p>
                        </Callout>
                    </div>
                </Card>

                <Card icons={['youtube']} title="আরও YouTube চ্যানেল" wide>
                    <OL>
                        <li>
                            <GoConnections /> পেজে YouTube কার্ডে <UI>Connect another account</UI> চাপুন।
                        </li>
                        <li>
                            Google এখন <b>প্রতিবার অ্যাকাউন্ট বেছে নিতে বলবে</b>। অন্য Google অ্যাকাউন্টের চ্যানেল যোগ করতে <UI>Use another account</UI> চেপে লগইন করুন।
                        </li>
                        <li>
                            <b>একই Google অ্যাকাউন্টে একাধিক চ্যানেল</b> (Brand account) থাকলে অনুমতির পর্দায় কোন চ্যানেল দিয়ে চালাবেন তা বেছে নিন। প্রতিটি চ্যানেলের জন্য আলাদা করে একবার করে Connect করুন।
                        </li>
                        <li>
                            “Google hasn’t verified this app” আসলে <UI>Advanced</UI> → <UI>Go to … (unsafe)</UI> চাপুন, আর দুটি পারমিশন বক্সেই টিক দিন।
                        </li>
                    </OL>
                    <div className="mt-3">
                        <Callout type="info" title="মনে রাখবেন">
                            <ul className="list-disc space-y-1 ps-5">
                                <li>
                                    YouTube-এর দৈনিক সীমা (প্রায় ৬টি আপলোড) <b>একই Google Cloud project-এর সব চ্যানেল মিলিয়ে</b>। চ্যানেল বাড়ালে সীমা বাড়ে না।
                                </li>
                                <li>
                                    অন্য মানুষের Google অ্যাকাউন্ট যোগ করতে চাইলে আপনার Google অ্যাপ <b>“In production”</b> (Publish করা) হতে হবে, নইলে শুধু <b>Test users</b> তালিকায় যোগ করা Gmail দিয়ে চলবে।
                                </li>
                            </ul>
                        </Callout>
                    </div>
                </Card>
            </div>

            <h3 className="font-semibold text-fg">অ্যাকাউন্টকে নিজের মতো নাম দিন</h3>
            <p className="text-sm leading-relaxed text-fg/80">
                অনেকগুলো অ্যাকাউন্ট থাকলে নাম গুলিয়ে যেতে পারে। <GoConnections /> পেজে অ্যাকাউন্টের নামের পাশের <b>পেন্সিল ✎</b> আইকনে ক্লিক করে নিজের মতো নাম দিন (যেমন “দোকানের পেজ” বা
                “ব্যক্তিগত”), তারপর <UI>Save</UI> চাপুন। এই নাম পোস্ট লেখার পেজ, ড্যাশবোর্ড ও পোস্টের তালিকায় দেখাবে। নাম মুছে দিলে আগের আসল নাম ফিরে আসবে।
            </p>

            <h3 className="font-semibold text-fg">একসাথে অনেক অ্যাকাউন্টে পোস্ট করুন</h3>
            <p className="text-sm leading-relaxed text-fg/80">
                নতুন পোস্টের ২ নম্বর ধাপে (“Publish to”) অ্যাকাউন্টগুলো প্ল্যাটফর্ম অনুযায়ী সাজানো থাকে। যেকোনো কয়টাতে টিক দিন, অথবা প্ল্যাটফর্মের পাশের <UI>Select all</UI> চেপে সব একসাথে বেছে নিন।
                প্রতিটি অ্যাকাউন্টের জন্য আলাদা আলাদা পোস্ট তৈরি হয়, তাই একটা ফেইল করলে বাকিগুলো আটকে যায় না।
            </p>
        </Section>
    );
}

/* ------------------------------ English ------------------------------ */

export function MoreEn() {
    return (
        <Section
            title="Add more accounts"
            subtitle="Several Facebook Pages, Instagram accounts, LinkedIn profiles and YouTube channels: as many as you like."
        >
            <Words>
                <p>
                    Every time you press <UI>Connect another account</UI> on the <GoConnections /> page, a <b>new account is added</b>. Existing ones are never removed or replaced, and
                    there is no limit. When you write a post you can publish to all of them at once or only the ones you tick.
                </p>
            </Words>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card icons={['facebook', 'instagram']} title="More Facebook Pages & Instagram">
                    <OL>
                        <li>
                            On <GoConnections /> press <UI>Connect another account</UI> on the <b>Facebook & Instagram</b> card.
                        </li>
                        <li>
                            In the Facebook window click <UI>Edit settings</UI> (or <UI>Edit access</UI>) next to “Continue as (your name)”.
                        </li>
                        <li>
                            <b>Tick the new Pages</b> (old ones stay ticked). Tick their Instagram accounts too.
                        </li>
                        <li>
                            <UI>Next</UI> → <UI>Save</UI>. Every Page and its linked Instagram account is added automatically.
                        </li>
                    </OL>
                    <div className="mt-3">
                        <Callout type="warn" title="Pages that belong to someone else’s Facebook account">
                            <p>
                                Because the Meta app is in <b>Development mode</b>, only the app’s <b>Admins / Developers / Testers</b> can authorize it. To add another person’s Facebook
                                account: developers.facebook.com → your app → <UI>App roles</UI> → <UI>Roles</UI> → <UI>Add People</UI> → make them a <b>Tester</b> or <b>Developer</b>.
                                After they accept the invitation, they can connect with their own account.
                            </p>
                        </Callout>
                    </div>
                </Card>

                <Card icons={['linkedin']} title="More LinkedIn profiles">
                    <OL>
                        <li>
                            LinkedIn always uses the account your browser is logged in to. First <b>log out of linkedin.com</b>, or open a <b>private / incognito window</b> and log in to this
                            tool there.
                        </li>
                        <li>
                            On <GoConnections /> press <UI>Connect another account</UI> on the LinkedIn card.
                        </li>
                        <li>
                            Log in to LinkedIn with the <b>second profile</b> and press <UI>Allow</UI>.
                        </li>
                    </OL>
                    <div className="mt-3">
                        <Callout type="info">
                            <p>For someone else’s profile, they log in and press <UI>Allow</UI> themselves. You never need their password.</p>
                        </Callout>
                    </div>
                </Card>

                <Card icons={['youtube']} title="More YouTube channels" wide>
                    <OL>
                        <li>
                            On <GoConnections /> press <UI>Connect another account</UI> on the YouTube card.
                        </li>
                        <li>
                            Google now <b>always asks which account to use</b>. To add a channel from another Google account press <UI>Use another account</UI> and log in.
                        </li>
                        <li>
                            If one Google account owns <b>several channels</b> (brand accounts), choose the channel on the permission screen. Connect once for each channel.
                        </li>
                        <li>
                            On “Google hasn’t verified this app” press <UI>Advanced</UI> → <UI>Go to … (unsafe)</UI> and tick both permission boxes.
                        </li>
                    </OL>
                    <div className="mt-3">
                        <Callout type="info" title="Remember">
                            <ul className="list-disc space-y-1 ps-5">
                                <li>
                                    YouTube’s daily limit (about 6 uploads) is shared by <b>all channels on the same Google Cloud project</b>. Adding channels does not raise it.
                                </li>
                                <li>
                                    To add other people’s Google accounts your Google app must be <b>“In production”</b> (published), otherwise only Gmail addresses on the{' '}
                                    <b>Test users</b> list work.
                                </li>
                            </ul>
                        </Callout>
                    </div>
                </Card>
            </div>

            <h3 className="font-semibold text-fg">Give accounts your own names</h3>
            <p className="text-sm leading-relaxed text-fg/80">
                With many accounts, names can get confusing. On <GoConnections /> click the <b>pencil ✎</b> next to an account name, type your own name (for example “Shop page” or
                “Personal”) and press <UI>Save</UI>. It shows in the composer, dashboard and post list. Clear it to get the original name back.
            </p>

            <h3 className="font-semibold text-fg">Post to many accounts at once</h3>
            <p className="text-sm leading-relaxed text-fg/80">
                In step 2 of a new post (“Publish to”) accounts are grouped by platform. Tick any of them, or press <UI>Select all</UI> next to a platform. Each account gets its own
                publishing job, so one failing never blocks the others.
            </p>
        </Section>
    );
}
