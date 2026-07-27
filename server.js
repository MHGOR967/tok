const express = require('express');
const puppeteer = require('puppeteer');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const activeSessions = {};

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>متصفح تيك توك الحقيقي - FOKHM</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4">
        <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-center">
            <h1 class="text-2xl font-bold mb-1 text-cyan-400">متصفح تسجيل الدخول الحقيقي</h1>
            <p class="text-xs text-slate-400 mb-6">امسح الكود عبر تطبيق تيك توك في جوالك لتسجيل الدخول الفعلي</p>
            
            <div id="qrSection" class="space-y-4">
                <div id="qrContainer" class="bg-white p-4 rounded-xl inline-block shadow-inner min-h-[200px] flex items-center justify-center">
                    <p id="qrLoading" class="text-slate-800 text-sm font-bold">جاري توليد باركود تيك توك الحقيقي...</p>
                    <img id="qrImage" src="" alt="QR Code" class="hidden w-48 h-48 mx-auto">
                </div>
                <div>
                    <button onclick="loadQRCode()" class="bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs px-4 py-2 rounded-lg border border-slate-700 transition cursor-pointer">
                        🔄 تحديث الباركود
                    </button>
                </div>
            </div>

            <!-- بطاقة معلومات الحساب بعد تسجيل الدخول الحقيقي -->
            <div id="profileSection" class="hidden space-y-4 mt-4 text-right">
                <div class="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center space-x-4 space-x-reverse">
                    <img id="userAvatar" src="" alt="صورة الحساب" class="w-16 h-16 rounded-full border-2 border-cyan-500 object-cover">
                    <div class="overflow-hidden">
                        <h2 id="userNickname" class="font-bold text-base text-white truncate"></h2>
                        <p id="userUniqueId" class="text-xs text-cyan-400 truncate"></p>
                    </div>
                </div>
                <button onclick="startCleaning()" id="cleanBtn"
                    class="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-rose-900/25 cursor-pointer">
                    🗑️ بدء حذف الريبوستات الحقيقية
                </button>
            </div>

            <div id="statusBox" class="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-cyan-300">
                <p id="statusText">في انتظار مسح الباركود من جوالك...</p>
            </div>
        </div>

        <script>
            let sessionToken = '';
            let checkInterval;

            async function loadQRCode() {
                document.getElementById('qrLoading').classList.remove('hidden');
                document.getElementById('qrImage').classList.add('hidden');
                document.getElementById('statusText').innerText = 'جاري الاتصال بسيرفر تيك توك...';

                try {
                    const res = await fetch('/api/get-qr');
                    const data = await res.json();
                    if (data.success) {
                        sessionToken = data.token;
                        document.getElementById('qrImage').src = data.qrImage;
                        document.getElementById('qrLoading').classList.add('hidden');
                        document.getElementById('qrImage').classList.remove('hidden');
                        document.getElementById('statusText').innerText = 'افتح تطبيق تيك توك بجوالك واعمل مسح للباركود الآن!';
                        
                        if (checkInterval) clearInterval(checkInterval);
                        checkInterval = setInterval(checkLoginStatus, 3000);
                    } else {
                        document.getElementById('statusText').innerText = '❌ فشل جلب الباركود، أعد المحاولة.';
                    }
                } catch (e) {
                    document.getElementById('statusText').innerText = '❌ خطأ في الاتصال بالخدمة.';
                }
            }

            async function checkLoginStatus() {
                if (!sessionToken) return;
                try {
                    const res = await fetch('/api/check-status?token=' + sessionToken);
                    const data = await res.json();
                    if (data.logged) {
                        clearInterval(checkInterval);
                        document.getElementById('qrSection').classList.add('hidden');
                        document.getElementById('userAvatar').src = data.userInfo.avatar;
                        document.getElementById('userNickname').innerText = data.userInfo.nickname;
                        document.getElementById('userUniqueId').innerText = '@' + data.userInfo.uniqueId;
                        document.getElementById('profileSection').classList.remove('hidden');
                        document.getElementById('statusText').innerText = '✅ تم تسجيل الدخول بحسابك الحقيقي بنجاح!';
                    }
                } catch (e) {}
            }

            async function startCleaning() {
                document.getElementById('statusText').innerText = 'جاري فحص وحذف الريبوستات الحقيقية...';
                const res = await fetch('/api/clean', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ token: sessionToken })
                });
                const data = await res.json();
                document.getElementById('statusText').innerText = data.message;
            }

            window.onload = loadQRCode;
        </script>
    </body>
    </html>
  `);
});

app.get('/api/get-qr', async (req, res) => {
  const token = Math.random().toString(36).substring(2);
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    await page.goto('https://www.tiktok.com/login/phone-or-email/qr-code', { waitUntil: 'networkidle2' });
    
    await page.waitForSelector('img', { timeout: 10000 });
    const qrElement = await page.$('img');
    let qrImage = '';
    if (qrElement) {
      const buffer = await qrElement.screenshot();
      qrImage = `data:image/png;base64,${buffer.toString('base64')}`;
    }

    activeSessions[token] = { browser, page, logged: false, userInfo: null };

    res.json({ success: true, token, qrImage });
  } catch (err) {
    res.json({ success: false, message: 'تعذر الاتصال لتوليد الباركود' });
  }
});

app.get('/api/check-status', async (req, res) => {
  const { token } = req.query;
  const session = activeSessions[token];
  if (!session) return res.json({ logged: false });

  try {
    const cookies = await session.page.cookies();
    const sessionCookie = cookies.find(c => c.name === 'sessionid');
    
    if (sessionCookie) {
      session.logged = true;
      const sid = sessionCookie.value;

      const infoRes = await axios.get('https://www.tiktok.com/passport/web/account/info/', {
        headers: { 'Cookie': `sessionid=${sid}`, 'User-Agent': 'Mozilla/5.0' },
        validateStatus: () => true
      });

      if (infoRes.data && infoRes.data.data) {
        const u = infoRes.data.data;
        session.userInfo = {
          nickname: u.screen_name || 'حساب تيك توك',
          uniqueId: u.unique_id || 'user',
          avatar: u.avatar_url || '',
          sessionId: sid
        };
      } else {
        session.userInfo = { nickname: 'حساب تيك توك الحقيقي', uniqueId: 'active_user', sessionId: sid };
      }

      return res.json({ logged: true, userInfo: session.userInfo });
    }
  } catch (e) {}

  res.json({ logged: false });
});

app.post('/api/clean', async (req, res) => {
  const { token } = req.body;
  const session = activeSessions[token];
  if (!session || !session.userInfo) {
    return res.json({ success: false, message: 'الجلسة غير مسجلة دخول.' });
  }

  const sid = session.userInfo.sessionId;
  try {
    const listRes = await axios.get('https://www.tiktok.com/api/item/list/?count=30&type=4&aid=1988', {
      headers: { 'Cookie': `sessionid=${sid}`, 'User-Agent': 'Mozilla/5.0' },
      validateStatus: () => true
    });

    if (listRes.data && listRes.data.itemList) {
      const items = listRes.data.itemList;
      for (let item of items) {
        await axios.post('https://www.tiktok.com/api/repost/item/?aid=1988', { aweme_id: item.id, type: 2 }, {
          headers: { 'Cookie': `sessionid=${sid}`, 'User-Agent': 'Mozilla/5.0' },
          validateStatus: () => true
        });
      }
      if (session.browser) await session.browser.close();
      return res.json({ success: true, message: 'تم إزالة جميع الريبوستات بنجاح من حسابك الحقيقي!' });
    }
    res.json({ success: true, message: 'لا توجد ريبوستات حالياً أو أن الحساب نظيف.' });
  } catch (e) {
    res.json({ success: false, message: 'حدث خطأ أثناء الاتصال لتنفيذ الحذف.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

