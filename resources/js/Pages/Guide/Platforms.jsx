import { Callout, Ext, GoConnections, GoSettings, RedirectBox, Section, Step, Steps, UI, Val, Words } from '@/Components/GuideParts';

const Points = ({ children }) => <ul className="list-disc space-y-1 ps-5">{children}</ul>;

/* ========================================================================== */
/* TELEGRAM                                                                   */
/* ========================================================================== */

export function TelegramEn() {
    return (
        <Section title="Connect Telegram" subtitle="Post to your channel or group. No developer account needed. About 10 minutes.">
            <Words>
                <p>
                    On Telegram you post through a <b>bot</b>: a robot account that you create yourself in 1 minute. The bot gets a secret <b>token</b> (like a password). You make the bot an
                    <b> administrator</b> of your channel, and then this tool can post there. Posts appear in the channel itself, not “from you”.
                </p>
            </Words>

            <Steps group="telegram">
                <Step title="Create your bot with @BotFather">
                    <p>
                        Open Telegram, search for <Val>@BotFather</Val> (the one with the blue tick), press <UI>Start</UI> and send the message <Val>/newbot</Val>. Choose a name (anything) and a
                        username that ends with <Val>bot</Val>, for example <Val>MyPostScheduler_bot</Val>.
                    </p>
                    <p>
                        BotFather replies with a <b>token</b> that looks like <Val>123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw</Val>. Copy it and keep it secret.
                    </p>
                </Step>

                <Step title="Create the channel (or pick your existing one)">
                    <p>
                        In Telegram: menu → <UI>New Channel</UI> → give it a name → choose <UI>Public</UI> and pick a link such as <Val>t.me/mychannel</Val> (or <UI>Private</UI>). For a group,
                        create it or use an existing one.
                    </p>
                    <Callout type="tip" title="Private channel? Do this trick">
                        <p>
                            This tool needs the channel’s name (<Val>@mychannel</Val>) only <b>once</b>, to find its numeric ID. So you can make the channel <b>Public</b> now, connect it here, then switch
                            it back to <b>Private</b>. The tool keeps working because it saved the numeric ID.
                        </p>
                    </Callout>
                </Step>

                <Step title="Make the bot an administrator of the channel">
                    <ol className="list-decimal space-y-1 ps-5">
                        <li>
                            Open the channel → tap its name at the top → <UI>Administrators</UI> → <UI>Add Administrator</UI>.
                        </li>
                        <li>Search for your bot’s username and select it.</li>
                        <li>
                            Keep <UI>Post Messages</UI> switched <b>on</b> → <UI>Save</UI>.
                        </li>
                    </ol>
                    <p>For a group: add the bot as a member (group info → Add members). Making it admin is optional there.</p>
                </Step>

                <Step title="Connect it in this tool">
                    <p>
                        Open <GoConnections />, press <UI>Add channel / group</UI> on the Telegram card, then paste:
                    </p>
                    <Points>
                        <li>
                            <b>Bot token:</b> from step 1
                        </li>
                        <li>
                            <b>Channel or group:</b> <Val>@mychannel</Val> (public) or the numeric ID like <Val>-1001234567890</Val>
                        </li>
                    </Points>
                    <p>
                        Press <UI>Connect</UI>. The tool checks with Telegram that the bot really is an admin, so a wrong token or missing admin right is reported immediately.
                    </p>
                </Step>
            </Steps>

            <Callout type="info" title="Good to know">
                <Points>
                    <li>Text limit is 4096 characters. If you attach a picture or video and your text is longer than 1024 characters, the media is sent first and the text follows as a second message.</li>
                    <li>Pictures up to 10 MB, videos up to 50 MB (Telegram’s limit for bots).</li>
                    <li>Text is posted exactly as typed (no formatting symbols are interpreted).</li>
                    <li>To post to several channels, add each one separately with the same or another bot.</li>
                </Points>
            </Callout>
        </Section>
    );
}

export function TelegramBn() {
    return (
        <Section title="Telegram কানেক্ট করুন" subtitle="আপনার চ্যানেল বা গ্রুপে পোস্ট করুন। ডেভেলপার অ্যাকাউন্ট লাগবে না। প্রায় ১০ মিনিট।">
            <Words>
                <p>
                    Telegram-এ পোস্ট হয় একটি <b>bot</b>-এর মাধ্যমে: এটা একটা রোবট অ্যাকাউন্ট যা আপনি নিজেই ১ মিনিটে বানাবেন। বটের একটা গোপন <b>token</b> থাকে (পাসওয়ার্ডের মতো)। বটকে আপনার
                    চ্যানেলের <b>অ্যাডমিন</b> বানালেই এই টুল সেখানে পোস্ট করতে পারবে। পোস্ট চ্যানেলের নামেই দেখাবে, “আপনার ব্যক্তিগত নামে” নয়।
                </p>
            </Words>

            <Steps group="telegram">
                <Step title="@BotFather দিয়ে বট বানান">
                    <p>
                        Telegram খুলে <Val>@BotFather</Val> সার্চ করুন (নীল টিক চিহ্নওয়ালাটা), <UI>Start</UI> চাপুন এবং <Val>/newbot</Val> লিখে পাঠান। একটা নাম দিন (যেকোনো) আর এমন একটা ইউজারনেম দিন যার শেষে{' '}
                        <Val>bot</Val> আছে, যেমন <Val>MyPostScheduler_bot</Val>।
                    </p>
                    <p>
                        BotFather একটা <b>token</b> পাঠাবে, দেখতে এমন: <Val>123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw</Val>। এটা কপি করে গোপন রাখুন।
                    </p>
                </Step>

                <Step title="চ্যানেল বানান (বা আগেরটা ব্যবহার করুন)">
                    <p>
                        Telegram-এ মেনু → <UI>New Channel</UI> → নাম দিন → <UI>Public</UI> বেছে <Val>t.me/mychannel</Val> এর মতো একটা লিংক দিন (অথবা <UI>Private</UI>)। গ্রুপ হলে গ্রুপ বানান বা আগেরটাই নিন।
                    </p>
                    <Callout type="tip" title="চ্যানেল Private হলে এই কৌশল">
                        <p>
                            এই টুলের চ্যানেলের নাম (<Val>@mychannel</Val>) লাগে <b>শুধু একবার</b>, সংখ্যার আইডি খুঁজে নিতে। তাই চ্যানেলটা এখন <b>Public</b> করুন, এখানে কানেক্ট করুন, তারপর আবার <b>Private</b> করে
                            দিন। এরপরও টুল ঠিকই কাজ করবে, কারণ সংখ্যার আইডি সেভ হয়ে গেছে।
                        </p>
                    </Callout>
                </Step>

                <Step title="বটকে চ্যানেলের অ্যাডমিন বানান">
                    <ol className="list-decimal space-y-1 ps-5">
                        <li>
                            চ্যানেল খুলুন → উপরে চ্যানেলের নামে ট্যাপ করুন → <UI>Administrators</UI> → <UI>Add Administrator</UI>।
                        </li>
                        <li>আপনার বটের ইউজারনেম সার্চ করে সিলেক্ট করুন।</li>
                        <li>
                            <UI>Post Messages</UI> চালু (on) রেখে <UI>Save</UI> চাপুন।
                        </li>
                    </ol>
                    <p>গ্রুপের ক্ষেত্রে: বটকে সদস্য হিসেবে যোগ করুন (group info → Add members)। ওখানে অ্যাডমিন বানানো ঐচ্ছিক।</p>
                </Step>

                <Step title="এই টুলে কানেক্ট করুন">
                    <p>
                        <GoConnections /> খুলে Telegram কার্ডে <UI>Add channel / group</UI> চাপুন, তারপর দিন:
                    </p>
                    <Points>
                        <li>
                            <b>Bot token:</b> ১ নম্বর ধাপেরটা
                        </li>
                        <li>
                            <b>Channel or group:</b> <Val>@mychannel</Val> (public হলে) অথবা সংখ্যার আইডি, যেমন <Val>-1001234567890</Val>
                        </li>
                    </Points>
                    <p>
                        <UI>Connect</UI> চাপুন। টুল Telegram-কে জিজ্ঞেস করে নিশ্চিত হয় যে বটটা সত্যিই অ্যাডমিন, তাই ভুল token বা অ্যাডমিন অনুমতি না থাকলে সাথে সাথেই জানিয়ে দেবে।
                    </p>
                </Step>
            </Steps>

            <Callout type="info" title="জেনে রাখুন">
                <Points>
                    <li>লেখার সীমা ৪০৯৬ অক্ষর। ছবি বা ভিডিওর সাথে লেখা ১০২৪ অক্ষরের বেশি হলে আগে মিডিয়া যাবে, লেখাটা পরে আলাদা মেসেজ হিসেবে যাবে।</li>
                    <li>ছবি সর্বোচ্চ ১০ MB, ভিডিও সর্বোচ্চ ৫০ MB (বটের জন্য Telegram-এর সীমা)।</li>
                    <li>লেখা হুবহু যেমন লিখেছেন তেমনই যায় (কোনো ফরম্যাটিং চিহ্ন কাজ করে না)।</li>
                    <li>একাধিক চ্যানেলে পোস্ট করতে প্রতিটি আলাদা করে যোগ করুন (একই বট বা অন্য বট দিয়ে)।</li>
                </Points>
            </Callout>
        </Section>
    );
}

/* ========================================================================== */
/* DISCORD                                                                    */
/* ========================================================================== */

export function DiscordEn() {
    return (
        <Section title="Connect Discord" subtitle="Post to a Discord channel. The easiest one: just copy one link. About 3 minutes.">
            <Words>
                <p>
                    Discord gives each channel a private posting link called a <b>webhook URL</b>. Anyone who has the link can post in that channel, so treat it like a password. You need no
                    developer account or app.
                </p>
            </Words>

            <Steps group="discord">
                <Step title="Open your server and the channel">
                    <p>
                        Open Discord (app or <Ext href="https://discord.com/app">discord.com/app</Ext>) and go to your server. You need the <b>Manage Webhooks</b> permission (server owners and admins
                        have it).
                    </p>
                </Step>
                <Step title="Create the webhook">
                    <ol className="list-decimal space-y-1 ps-5">
                        <li>
                            Hover over the channel name and click the <b>gear</b> (<UI>Edit Channel</UI>).
                        </li>
                        <li>
                            Open <UI>Integrations</UI> → <UI>Webhooks</UI> → <UI>New Webhook</UI>.
                        </li>
                        <li>
                            Give it a name (this name appears as the sender, for example “Announcements”) and check that the right channel is selected.
                        </li>
                        <li>
                            Press <UI>Copy Webhook URL</UI>.
                        </li>
                    </ol>
                </Step>
                <Step title="Connect it in this tool">
                    <p>
                        Open <GoConnections />, press <UI>Add channel webhook</UI> on the Discord card, paste the URL and press <UI>Connect</UI>. The tool checks the link with Discord first.
                    </p>
                </Step>
            </Steps>

            <Callout type="info" title="Good to know">
                <Points>
                    <li>One webhook = one channel. For several channels add several webhooks.</li>
                    <li>Text up to 2000 characters. Files up to 10 MB (the safe limit for servers without boosts).</li>
                    <li>
                        Posts can never ping <Val>@everyone</Val>, <Val>@here</Val> or roles. This tool switches those mentions off.
                    </li>
                    <li>To stop access, delete the webhook in Discord (Edit Channel → Integrations → Webhooks). The account here will show “Needs reconnect”.</li>
                </Points>
            </Callout>
        </Section>
    );
}

export function DiscordBn() {
    return (
        <Section title="Discord কানেক্ট করুন" subtitle="Discord চ্যানেলে পোস্ট করুন। সবচেয়ে সহজটা: শুধু একটা লিংক কপি করতে হয়। প্রায় ৩ মিনিট।">
            <Words>
                <p>
                    Discord প্রতিটি চ্যানেলকে একটা গোপন পোস্ট করার লিংক দেয়, যার নাম <b>webhook URL</b>। এই লিংক যার কাছে থাকবে সে ওই চ্যানেলে পোস্ট করতে পারবে, তাই এটাকে পাসওয়ার্ডের মতো গোপন রাখুন। কোনো ডেভেলপার
                    অ্যাকাউন্ট বা অ্যাপ লাগে না।
                </p>
            </Words>

            <Steps group="discord">
                <Step title="সার্ভার ও চ্যানেল খুলুন">
                    <p>
                        Discord খুলুন (অ্যাপ বা <Ext href="https://discord.com/app">discord.com/app</Ext>) এবং আপনার সার্ভারে যান। আপনার <b>Manage Webhooks</b> অনুমতি থাকতে হবে (সার্ভারের মালিক ও অ্যাডমিনদের থাকে)।
                    </p>
                </Step>
                <Step title="Webhook বানান">
                    <ol className="list-decimal space-y-1 ps-5">
                        <li>
                            চ্যানেলের নামের উপর মাউস রেখে <b>গিয়ার</b> আইকনে (<UI>Edit Channel</UI>) ক্লিক করুন।
                        </li>
                        <li>
                            <UI>Integrations</UI> → <UI>Webhooks</UI> → <UI>New Webhook</UI> চাপুন।
                        </li>
                        <li>একটা নাম দিন (এই নামে মেসেজ আসবে, যেমন “Announcements”) এবং সঠিক চ্যানেল সিলেক্ট করা আছে কি না দেখুন।</li>
                        <li>
                            <UI>Copy Webhook URL</UI> চাপুন।
                        </li>
                    </ol>
                </Step>
                <Step title="এই টুলে কানেক্ট করুন">
                    <p>
                        <GoConnections /> খুলে Discord কার্ডে <UI>Add channel webhook</UI> চাপুন, লিংকটা পেস্ট করে <UI>Connect</UI> চাপুন। টুল আগে Discord-কে দিয়ে লিংকটা যাচাই করে নেয়।
                    </p>
                </Step>
            </Steps>

            <Callout type="info" title="জেনে রাখুন">
                <Points>
                    <li>একটা webhook = একটা চ্যানেল। একাধিক চ্যানেলের জন্য একাধিক webhook যোগ করুন।</li>
                    <li>লেখা সর্বোচ্চ ২০০০ অক্ষর। ফাইল সর্বোচ্চ ১০ MB (boost ছাড়া সার্ভারের জন্য নিরাপদ সীমা)।</li>
                    <li>
                        পোস্ট কখনো <Val>@everyone</Val>, <Val>@here</Val> বা রোলকে পিং করবে না। এই টুল ওগুলো বন্ধ করে রাখে।
                    </li>
                    <li>অ্যাক্সেস বন্ধ করতে Discord-এ webhook টা মুছে দিন (Edit Channel → Integrations → Webhooks)। তখন এখানে অ্যাকাউন্টে “Needs reconnect” দেখাবে।</li>
                </Points>
            </Callout>
        </Section>
    );
}

/* ========================================================================== */
/* THREADS                                                                    */
/* ========================================================================== */

export function ThreadsEn({ redirects }) {
    return (
        <Section title="Connect Threads" subtitle="Text, image and video posts to your Threads profile. About 20 minutes.">
            <Words>
                <p>
                    Threads uses the same <b>Meta developer website</b> as Facebook and Instagram, but it has its <b>own App ID and App Secret</b> inside your Meta app. You must also add yourself
                    as a “Threads tester” because the app stays in Development mode (no review needed).
                </p>
            </Words>

            <Steps group="threads">
                <Step title="Open your Meta app">
                    <p>
                        Go to <Ext href="https://developers.facebook.com/apps">developers.facebook.com/apps</Ext> and open the app you made for Facebook (if you have none yet, press{' '}
                        <UI>Create app</UI>, name it and choose the use case <UI>Access the Threads API</UI>).
                    </p>
                </Step>
                <Step title="Add the Threads use case">
                    <p>
                        In the app dashboard open <UI>Use cases</UI> → <UI>Add use case</UI> → choose <UI>Access the Threads API</UI> → <UI>Customize</UI>. In <UI>Permissions and features</UI> add{' '}
                        <UI>threads_basic</UI> and <UI>threads_content_publish</UI>.
                    </p>
                </Step>
                <Step title="Copy the Threads App ID and Secret">
                    <p>
                        Inside the Threads use case open <UI>Settings</UI>. Copy the <b>Threads app ID</b> and the <b>Threads app secret</b> (press <UI>Show</UI>).
                    </p>
                    <Callout type="warn">
                        <p>These are <b>different</b> from the main App ID / App Secret of your Meta app. Use the Threads ones.</p>
                    </Callout>
                </Step>
                <Step title="Register the Redirect URI">
                    <p>
                        On the same <UI>Settings</UI> page find <b>Redirect callback URLs</b>, paste the address below and save.
                    </p>
                    <RedirectBox value={redirects.threads} what="Threads" />
                    <p>
                        If Meta also asks for an <b>Uninstall callback URL</b> and a <b>Delete callback URL</b>, enter any https address (for example the same address of this tool). They are not used.
                    </p>
                </Step>
                <Step title="Add yourself as a Threads tester">
                    <ol className="list-decimal space-y-1 ps-5">
                        <li>
                            In the Meta app: <UI>App roles</UI> → <UI>Roles</UI> → <UI>Add People</UI> → choose <UI>Threads Tester</UI> → type your <b>Threads username</b> → <UI>Add</UI>.
                        </li>
                        <li>
                            Open Threads (app or <Ext href="https://www.threads.com">threads.com</Ext>) → <UI>Settings</UI> → <UI>Account</UI> → <UI>Website permissions</UI> → <UI>Invites</UI> → <UI>Accept</UI>.
                        </li>
                    </ol>
                </Step>
                <Step title="Paste the codes into this tool">
                    <p>
                        Open <GoSettings />, find the <b>Threads</b> box, paste the Threads App ID and Secret and press <UI>Save settings</UI>.
                    </p>
                </Step>
                <Step title="Press Connect">
                    <p>
                        Open <GoConnections />, press <UI>Connect</UI> on the Threads card and press <UI>Allow</UI> on the Threads screen.
                    </p>
                </Step>
            </Steps>

            <Callout type="warn" title="Pictures and videos need a public link">
                <p>
                    Like Instagram, Threads downloads your image or video from the internet, so on your own computer you need the <b>Public base URL</b> (see the tab “Instagram public link”, it
                    works for Threads too). Text-only posts need nothing extra.
                </p>
            </Callout>

            <Callout type="info" title="Good to know">
                <Points>
                    <li>Text up to 500 characters, at most 5 links. Images JPEG or PNG up to 8 MB. Videos MP4 or MOV up to 5 minutes / 1 GB.</li>
                    <li>Up to 250 posts per 24 hours per profile.</li>
                    <li>The connection lasts 60 days and this tool renews it automatically every day it is close to expiry.</li>
                </Points>
            </Callout>
        </Section>
    );
}

export function ThreadsBn({ redirects }) {
    return (
        <Section title="Threads কানেক্ট করুন" subtitle="আপনার Threads প্রোফাইলে লেখা, ছবি ও ভিডিও পোস্ট। প্রায় ২০ মিনিট।">
            <Words>
                <p>
                    Threads-ও Facebook আর Instagram-এর মতো একই <b>Meta ডেভেলপার ওয়েবসাইট</b> ব্যবহার করে, তবে আপনার Meta অ্যাপের ভেতরে এর <b>নিজস্ব App ID ও App Secret</b> আছে। অ্যাপ Development mode-এ থাকে
                    বলে নিজেকে “Threads tester” হিসেবে যোগ করতে হবে (কোনো রিভিউ লাগে না)।
                </p>
            </Words>

            <Steps group="threads">
                <Step title="আপনার Meta অ্যাপ খুলুন">
                    <p>
                        <Ext href="https://developers.facebook.com/apps">developers.facebook.com/apps</Ext> এ যান এবং Facebook-এর জন্য যে অ্যাপ বানিয়েছেন সেটা খুলুন (এখনো না থাকলে <UI>Create app</UI> চাপুন, নাম দিন
                        এবং use case হিসেবে <UI>Access the Threads API</UI> বেছে নিন)।
                    </p>
                </Step>
                <Step title="Threads use case যোগ করুন">
                    <p>
                        অ্যাপ ড্যাশবোর্ডে <UI>Use cases</UI> → <UI>Add use case</UI> → <UI>Access the Threads API</UI> বেছে <UI>Customize</UI> চাপুন। <UI>Permissions and features</UI> এ <UI>threads_basic</UI> আর{' '}
                        <UI>threads_content_publish</UI> যোগ করুন।
                    </p>
                </Step>
                <Step title="Threads App ID ও Secret কপি করুন">
                    <p>
                        Threads use case-এর ভেতরে <UI>Settings</UI> খুলুন। <b>Threads app ID</b> আর <b>Threads app secret</b> (<UI>Show</UI> চেপে) কপি করুন।
                    </p>
                    <Callout type="warn">
                        <p>এগুলো আপনার Meta অ্যাপের মূল App ID / App Secret থেকে <b>আলাদা</b>। Threads-এরটাই নিন।</p>
                    </Callout>
                </Step>
                <Step title="Redirect URI নিবন্ধন করুন">
                    <p>
                        একই <UI>Settings</UI> পেজে <b>Redirect callback URLs</b> খুঁজে নিচের ঠিকানা পেস্ট করুন এবং সেভ করুন।
                    </p>
                    <RedirectBox value={redirects.threads} what="Threads" />
                    <p>
                        Meta যদি <b>Uninstall callback URL</b> আর <b>Delete callback URL</b> ও চায়, যেকোনো https ঠিকানা দিন (যেমন এই টুলের ঠিকানাই)। এগুলো ব্যবহার হয় না।
                    </p>
                </Step>
                <Step title="নিজেকে Threads tester হিসেবে যোগ করুন">
                    <ol className="list-decimal space-y-1 ps-5">
                        <li>
                            Meta অ্যাপে: <UI>App roles</UI> → <UI>Roles</UI> → <UI>Add People</UI> → <UI>Threads Tester</UI> বেছে আপনার <b>Threads ইউজারনেম</b> লিখে <UI>Add</UI> চাপুন।
                        </li>
                        <li>
                            Threads খুলুন (অ্যাপ বা <Ext href="https://www.threads.com">threads.com</Ext>) → <UI>Settings</UI> → <UI>Account</UI> → <UI>Website permissions</UI> → <UI>Invites</UI> → <UI>Accept</UI>।
                        </li>
                    </ol>
                </Step>
                <Step title="কোড দুটি এই টুলে পেস্ট করুন">
                    <p>
                        <GoSettings /> খুলে <b>Threads</b> বক্সে Threads App ID আর Secret পেস্ট করে <UI>Save settings</UI> চাপুন।
                    </p>
                </Step>
                <Step title="Connect চাপুন">
                    <p>
                        <GoConnections /> পেজে Threads কার্ডে <UI>Connect</UI> চাপুন এবং Threads-এর পর্দায় <UI>Allow</UI> চাপুন।
                    </p>
                </Step>
            </Steps>

            <Callout type="warn" title="ছবি ও ভিডিওর জন্য পাবলিক লিংক লাগে">
                <p>
                    Instagram-এর মতো Threads-ও ইন্টারনেট থেকে আপনার ছবি/ভিডিও নামিয়ে নেয়, তাই নিজের কম্পিউটারে চালালে <b>Public base URL</b> দরকার (“Instagram পাবলিক লিংক” ট্যাব দেখুন, ওটা Threads-এর জন্যও
                    কাজ করে)। শুধু লেখার পোস্টে বাড়তি কিছু লাগে না।
                </p>
            </Callout>

            <Callout type="info" title="জেনে রাখুন">
                <Points>
                    <li>লেখা সর্বোচ্চ ৫০০ অক্ষর, সর্বোচ্চ ৫টি লিংক। ছবি JPEG বা PNG সর্বোচ্চ ৮ MB। ভিডিও MP4 বা MOV সর্বোচ্চ ৫ মিনিট / ১ GB।</li>
                    <li>প্রতি প্রোফাইলে ২৪ ঘণ্টায় সর্বোচ্চ ২৫০টি পোস্ট।</li>
                    <li>কানেকশন ৬০ দিন থাকে, মেয়াদ কাছাকাছি এলে এই টুল নিজে থেকেই নবায়ন করে নেয়।</li>
                </Points>
            </Callout>
        </Section>
    );
}

/* ========================================================================== */
/* X (TWITTER)                                                                */
/* ========================================================================== */

export function XEn({ redirects }) {
    return (
        <Section title="Connect X (Twitter)" subtitle="Posts with text, one image or one video. About 25 minutes, and it needs a payment method.">
            <Callout type="warn" title="X charges for posting">
                <p>
                    X’s API is now <b>pay-per-use</b>. As reported in 2026, there is no free posting tier for new developers: you add a payment method and buy credits in the X developer console. Roughly{' '}
                    <b>US$0.015 per post</b>, and about <b>US$0.20 per post that contains a link</b>. These prices change, so check the <b>Billing</b> page of your developer console before you start.
                    Posting 5 plain posts a day costs only a few dollars a month. If you do not want to pay, skip X.
                </p>
            </Callout>

            <Steps group="x">
                <Step title="Sign up for the X developer portal">
                    <p>
                        Go to <Ext href="https://developer.x.com">developer.x.com</Ext>, log in with the X account you want to post from and sign up for developer access. When it asks what you will build,
                        write something honest like “scheduling posts for my own account”.
                    </p>
                </Step>
                <Step title="Create an app">
                    <p>
                        In the Developer Console open <UI>Apps</UI> (or <UI>Projects &amp; Apps</UI>) → <UI>Create app</UI>, and give it a name such as <Val>My Post Scheduler</Val>.
                    </p>
                </Step>
                <Step title="Add credits (billing)">
                    <p>
                        Open <UI>Billing</UI> in the console, add a payment method and buy a small amount of credits (for example US$5). Without credits every post fails with a “payment required” error.
                    </p>
                </Step>
                <Step title="Turn on user login (OAuth 2.0) for the app">
                    <p>
                        Open your app → <UI>User authentication settings</UI> → <UI>Set up</UI> and choose:
                    </p>
                    <Points>
                        <li>
                            <b>App permissions:</b> <UI>Read and write</UI>
                        </li>
                        <li>
                            <b>Type of App:</b> <UI>Web App, Automated App or Bot</UI> (a confidential client)
                        </li>
                        <li>
                            <b>Callback URI / Redirect URL:</b> paste the address below
                        </li>
                        <li>
                            <b>Website URL:</b> your website, or any address such as <Val>https://example.com</Val>
                        </li>
                    </Points>
                    <RedirectBox value={redirects.x} what="X" />
                    <p>
                        Press <UI>Save</UI>.
                    </p>
                </Step>
                <Step title="Copy the Client ID and Client Secret">
                    <p>
                        Open <UI>Keys and tokens</UI> → <b>OAuth 2.0 Client ID and Client Secret</b>. Copy the <b>Client ID</b> and press <UI>Generate</UI> (or <UI>Regenerate</UI>) for the{' '}
                        <b>Client Secret</b>. <b>Copy the secret now</b>: X shows it only once.
                    </p>
                    <Callout type="warn">
                        <p>
                            Use the <b>OAuth 2.0</b> pair, not “API Key and Secret” or “Bearer Token”.
                        </p>
                    </Callout>
                </Step>
                <Step title="Paste the codes into this tool">
                    <p>
                        Open <GoSettings />, find the <b>X (Twitter)</b> box, paste both and press <UI>Save settings</UI>.
                    </p>
                </Step>
                <Step title="Press Connect">
                    <p>
                        Open <GoConnections />, press <UI>Connect</UI> on the X card and press <UI>Authorize app</UI> on the X screen.
                    </p>
                </Step>
            </Steps>

            <Callout type="info" title="Good to know">
                <Points>
                    <li>280 characters; every link counts as 23 characters whatever its real length.</li>
                    <li>One image (up to 5 MB) or one video (typically up to 140 seconds) per post.</li>
                    <li>X rejects identical posts sent twice. The error message from X is shown on the post.</li>
                    <li>The connection renews itself automatically (X access tokens last about 2 hours and refresh behind the scenes).</li>
                </Points>
            </Callout>
        </Section>
    );
}

export function XBn({ redirects }) {
    return (
        <Section title="X (Twitter) কানেক্ট করুন" subtitle="লেখা, একটি ছবি বা একটি ভিডিও সহ পোস্ট। প্রায় ২৫ মিনিট, আর পেমেন্ট মেথড লাগবে।">
            <Callout type="warn" title="X-এ পোস্ট করতে টাকা লাগে">
                <p>
                    X-এর API এখন <b>pay-per-use</b> (যত ব্যবহার তত খরচ)। ২০২৬-এর তথ্য অনুযায়ী নতুন ডেভেলপারদের জন্য ফ্রি পোস্টিং নেই: X developer console-এ পেমেন্ট মেথড যোগ করে ক্রেডিট কিনতে হয়। মোটামুটি{' '}
                    <b>প্রতি পোস্টে প্রায় US$0.015</b>, আর <b>লিংকসহ পোস্টে প্রায় US$0.20</b>। দাম বদলাতে পারে, তাই শুরুর আগে আপনার developer console-এর <b>Billing</b> পেজে দেখে নিন। দিনে ৫টা সাধারণ পোস্টে মাসে
                    কয়েক ডলার লাগে। টাকা খরচ করতে না চাইলে X বাদ দিন।
                </p>
            </Callout>

            <Steps group="x">
                <Step title="X developer portal-এ সাইন আপ করুন">
                    <p>
                        <Ext href="https://developer.x.com">developer.x.com</Ext> এ যান, যে X অ্যাকাউন্ট থেকে পোস্ট করতে চান সেটা দিয়ে লগইন করে developer access-এর জন্য সাইন আপ করুন। কী বানাবেন জিজ্ঞেস করলে সৎভাবে লিখুন, যেমন
                        “নিজের অ্যাকাউন্টের পোস্ট শিডিউল করা”।
                    </p>
                </Step>
                <Step title="একটা অ্যাপ বানান">
                    <p>
                        Developer Console-এ <UI>Apps</UI> (বা <UI>Projects &amp; Apps</UI>) → <UI>Create app</UI> চাপুন এবং <Val>My Post Scheduler</Val> এর মতো একটা নাম দিন।
                    </p>
                </Step>
                <Step title="ক্রেডিট যোগ করুন (billing)">
                    <p>
                        Console-এ <UI>Billing</UI> খুলে পেমেন্ট মেথড যোগ করুন এবং অল্প কিছু ক্রেডিট কিনুন (যেমন US$5)। ক্রেডিট না থাকলে প্রতিটি পোস্ট “payment required” এরর দিয়ে ফেইল করবে।
                    </p>
                </Step>
                <Step title="অ্যাপে ইউজার লগইন (OAuth 2.0) চালু করুন">
                    <p>
                        আপনার অ্যাপ → <UI>User authentication settings</UI> → <UI>Set up</UI> চেপে এগুলো বেছে নিন:
                    </p>
                    <Points>
                        <li>
                            <b>App permissions:</b> <UI>Read and write</UI>
                        </li>
                        <li>
                            <b>Type of App:</b> <UI>Web App, Automated App or Bot</UI> (confidential client)
                        </li>
                        <li>
                            <b>Callback URI / Redirect URL:</b> নিচের ঠিকানা পেস্ট করুন
                        </li>
                        <li>
                            <b>Website URL:</b> আপনার ওয়েবসাইট, অথবা <Val>https://example.com</Val> এর মতো যেকোনো ঠিকানা
                        </li>
                    </Points>
                    <RedirectBox value={redirects.x} what="X" />
                    <p>
                        <UI>Save</UI> চাপুন।
                    </p>
                </Step>
                <Step title="Client ID ও Client Secret কপি করুন">
                    <p>
                        <UI>Keys and tokens</UI> → <b>OAuth 2.0 Client ID and Client Secret</b> খুলুন। <b>Client ID</b> কপি করুন এবং <b>Client Secret</b>-এর জন্য <UI>Generate</UI> (বা <UI>Regenerate</UI>) চাপুন।{' '}
                        <b>Secret এখনই কপি করে রাখুন</b>, X এটা শুধু একবারই দেখায়।
                    </p>
                    <Callout type="warn">
                        <p>
                            <b>OAuth 2.0</b>-এর জোড়াটা নিন, “API Key and Secret” বা “Bearer Token” নয়।
                        </p>
                    </Callout>
                </Step>
                <Step title="কোড দুটি এই টুলে পেস্ট করুন">
                    <p>
                        <GoSettings /> খুলে <b>X (Twitter)</b> বক্সে দুটোই পেস্ট করে <UI>Save settings</UI> চাপুন।
                    </p>
                </Step>
                <Step title="Connect চাপুন">
                    <p>
                        <GoConnections /> পেজে X কার্ডে <UI>Connect</UI> চাপুন এবং X-এর পর্দায় <UI>Authorize app</UI> চাপুন।
                    </p>
                </Step>
            </Steps>

            <Callout type="info" title="জেনে রাখুন">
                <Points>
                    <li>২৮০ অক্ষর; প্রতিটি লিংক আসল দৈর্ঘ্য যাই হোক, ২৩ অক্ষর হিসেবে গোনা হয়।</li>
                    <li>প্রতি পোস্টে একটি ছবি (সর্বোচ্চ ৫ MB) অথবা একটি ভিডিও (সাধারণত সর্বোচ্চ ১৪০ সেকেন্ড)।</li>
                    <li>একই লেখা দুইবার পাঠালে X নেয় না। X-এর এরর মেসেজ পোস্টের নিচে দেখানো হয়।</li>
                    <li>কানেকশন নিজে থেকেই নবায়ন হয় (X-এর access token প্রায় ২ ঘণ্টা থাকে এবং পেছনে নিজে নিজে refresh হয়)।</li>
                </Points>
            </Callout>
        </Section>
    );
}

/* ========================================================================== */
/* WORDPRESS                                                                  */
/* ========================================================================== */

export function WordPressEn() {
    return (
        <Section title="Connect WordPress" subtitle="Publish blog posts to your own WordPress site. About 5 minutes.">
            <Words>
                <p>
                    WordPress has a safe feature called an <b>Application Password</b>: a special password for one app that you can delete at any time without changing your real password. This tool uses
                    it to create posts on your site.
                </p>
            </Words>

            <Callout type="info" title="What you need">
                <Points>
                    <li>
                        A <b>self-hosted WordPress</b> site (WordPress 5.6 or newer) that uses <b>HTTPS</b>. (A free WordPress.com site cannot be used; WordPress.com needs a Business plan.)
                    </li>
                    <li>A user with the role <b>Author, Editor or Administrator</b>.</li>
                </Points>
            </Callout>

            <Steps group="wordpress">
                <Step title="Log in to wp-admin">
                    <p>
                        Open <Val>https://your-site.com/wp-admin</Val> and log in.
                    </p>
                </Step>
                <Step title="Open your profile">
                    <p>
                        In the left menu choose <UI>Users</UI> → <UI>Profile</UI> (or click your name at the top right → <UI>Edit Profile</UI>).
                    </p>
                </Step>
                <Step title="Create an Application Password">
                    <ol className="list-decimal space-y-1 ps-5">
                        <li>
                            Scroll down to the section <b>Application Passwords</b>.
                        </li>
                        <li>
                            In <b>New Application Password Name</b> type <Val>Post Scheduler</Val> and press <UI>Add New Application Password</UI>.
                        </li>
                        <li>
                            A password like <Val>abcd EFGH 1234 ijkl MNOP 5678</Val> appears. <b>Copy it now</b>, WordPress shows it only once. Spaces do not matter.
                        </li>
                    </ol>
                </Step>
                <Step title="Connect it in this tool">
                    <p>
                        Open <GoConnections />, press <UI>Add WordPress site</UI> on the WordPress card and enter:
                    </p>
                    <Points>
                        <li>
                            <b>Site address:</b> for example <Val>https://myblog.com</Val>
                        </li>
                        <li>
                            <b>WordPress username:</b> the name you log in with
                        </li>
                        <li>
                            <b>Application Password:</b> the one you just copied
                        </li>
                    </Points>
                    <p>
                        Press <UI>Connect</UI>. The tool logs in to your site once to check everything.
                    </p>
                </Step>
                <Step title="Write a post">
                    <p>
                        In <b>New post</b> tick your WordPress site. A box “WordPress options” lets you set the <b>title</b> and the <b>status</b> (<UI>Publish</UI>, <UI>Save as draft</UI> or{' '}
                        <UI>Pending review</UI>). Without a title the first line of your text is used.
                    </p>
                </Step>
            </Steps>

            <Callout type="info" title="How posts look on your site">
                <Points>
                    <li>Blank lines in your text become paragraphs. HTML typed in the text is shown as plain text, not run.</li>
                    <li>An image becomes the post’s <b>featured image</b> and is also shown at the top. A video is uploaded to your media library and embedded at the top.</li>
                    <li>Large files are limited by your hosting’s upload size (<Val>upload_max_filesize</Val>).</li>
                </Points>
            </Callout>

            <Callout type="warn" title="Problems?">
                <Points>
                    <li>
                        <b>No “Application Passwords” section:</b> the site is not on HTTPS, WordPress is older than 5.6, or a security plugin turned it off.
                    </li>
                    <li>
                        <b>“Could not reach the REST API”:</b> in <UI>Settings</UI> → <UI>Permalinks</UI> choose anything except “Plain”, and make sure a security plugin or Cloudflare rule is not blocking <Val>/wp-json</Val>.
                    </li>
                    <li>
                        To revoke access later, delete the Application Password in the same profile section.
                    </li>
                </Points>
            </Callout>
        </Section>
    );
}

export function WordPressBn() {
    return (
        <Section title="WordPress কানেক্ট করুন" subtitle="আপনার নিজের WordPress সাইটে ব্লগ পোস্ট প্রকাশ করুন। প্রায় ৫ মিনিট।">
            <Words>
                <p>
                    WordPress-এ <b>Application Password</b> নামে একটা নিরাপদ সুবিধা আছে: এটা একটা অ্যাপের জন্য আলাদা পাসওয়ার্ড, যেটা যেকোনো সময় আপনার আসল পাসওয়ার্ড না বদলেই মুছে ফেলা যায়। এই টুল ওটা দিয়েই আপনার সাইটে
                    পোস্ট বানায়।
                </p>
            </Words>

            <Callout type="info" title="যা লাগবে">
                <Points>
                    <li>
                        <b>নিজস্ব হোস্টিংয়ে চলা WordPress</b> সাইট (WordPress ৫.৬ বা নতুন), যেটা <b>HTTPS</b> ব্যবহার করে। (ফ্রি WordPress.com সাইটে হবে না; WordPress.com-এ Business plan লাগে।)
                    </li>
                    <li>একজন ইউজার যার রোল <b>Author, Editor বা Administrator</b>।</li>
                </Points>
            </Callout>

            <Steps group="wordpress">
                <Step title="wp-admin-এ লগইন করুন">
                    <p>
                        <Val>https://your-site.com/wp-admin</Val> খুলে লগইন করুন।
                    </p>
                </Step>
                <Step title="আপনার প্রোফাইল খুলুন">
                    <p>
                        বাঁ দিকের মেনু থেকে <UI>Users</UI> → <UI>Profile</UI> বেছে নিন (অথবা উপরে ডানদিকে আপনার নামে ক্লিক করে <UI>Edit Profile</UI>)।
                    </p>
                </Step>
                <Step title="Application Password বানান">
                    <ol className="list-decimal space-y-1 ps-5">
                        <li>
                            নিচে নেমে <b>Application Passwords</b> অংশ খুঁজুন।
                        </li>
                        <li>
                            <b>New Application Password Name</b> এ <Val>Post Scheduler</Val> লিখে <UI>Add New Application Password</UI> চাপুন।
                        </li>
                        <li>
                            <Val>abcd EFGH 1234 ijkl MNOP 5678</Val> এর মতো একটা পাসওয়ার্ড দেখাবে। <b>এখনই কপি করুন</b>, WordPress এটা শুধু একবারই দেখায়। স্পেস থাকলে সমস্যা নেই।
                        </li>
                    </ol>
                </Step>
                <Step title="এই টুলে কানেক্ট করুন">
                    <p>
                        <GoConnections /> খুলে WordPress কার্ডে <UI>Add WordPress site</UI> চাপুন এবং দিন:
                    </p>
                    <Points>
                        <li>
                            <b>Site address:</b> যেমন <Val>https://myblog.com</Val>
                        </li>
                        <li>
                            <b>WordPress username:</b> যে নামে লগইন করেন
                        </li>
                        <li>
                            <b>Application Password:</b> এইমাত্র কপি করাটা
                        </li>
                    </Points>
                    <p>
                        <UI>Connect</UI> চাপুন। টুল সবকিছু যাচাই করতে একবার আপনার সাইটে লগইন করে দেখে।
                    </p>
                </Step>
                <Step title="একটা পোস্ট লিখুন">
                    <p>
                        <b>New post</b>-এ আপনার WordPress সাইটে টিক দিন। “WordPress options” বক্সে <b>title</b> আর <b>status</b> (<UI>Publish</UI>, <UI>Save as draft</UI> বা <UI>Pending review</UI>) ঠিক করা যায়।
                        title না দিলে লেখার প্রথম লাইনটাই title হবে।
                    </p>
                </Step>
            </Steps>

            <Callout type="info" title="সাইটে পোস্ট কেমন দেখাবে">
                <Points>
                    <li>লেখার ফাঁকা লাইন গুলো প্যারাগ্রাফ হবে। লেখার ভেতরে HTML লিখলে সেটা সাধারণ লেখা হিসেবেই দেখাবে, চলবে না।</li>
                    <li>ছবি পোস্টের <b>featured image</b> হবে এবং উপরেও দেখাবে। ভিডিও আপনার media library-তে আপলোড হয়ে উপরে এমবেড হবে।</li>
                    <li>বড় ফাইল আপনার হোস্টিংয়ের আপলোড সীমা (<Val>upload_max_filesize</Val>) দিয়ে আটকে যেতে পারে।</li>
                </Points>
            </Callout>

            <Callout type="warn" title="সমস্যা হলে">
                <Points>
                    <li>
                        <b>“Application Passwords” অংশ নেই:</b> সাইট HTTPS-এ নেই, WordPress ৫.৬-এর পুরনো, অথবা কোনো security plugin এটা বন্ধ করে রেখেছে।
                    </li>
                    <li>
                        <b>“Could not reach the REST API”:</b> <UI>Settings</UI> → <UI>Permalinks</UI> এ “Plain” ছাড়া অন্য কিছু বেছে নিন, আর কোনো security plugin বা Cloudflare নিয়ম <Val>/wp-json</Val> আটকে দিচ্ছে কি না দেখুন।
                    </li>
                    <li>পরে অ্যাক্সেস বন্ধ করতে একই প্রোফাইল অংশ থেকে Application Password টা মুছে দিন।</li>
                </Points>
            </Callout>
        </Section>
    );
}
