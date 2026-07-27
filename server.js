const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>منظف ريبوستات تيك توك الحقيقي - FOKHM</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4">
        <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h1 class="text-2xl font-bold text-center mb-1 text-cyan-400">إدارة تيك توك الحقيقية</h1>
            <p class="text-xs text-slate-400 text-center mb-6">أدخل كوكيز الجلسة (sessionid) الخاص بحسابك الحقيقي</p>
            
            <div id="loginSection" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-1 text-slate-300">قيمة الـ Session ID:</label>
                    <input type="text" id="sessionId" placeholder="الصق الـ sessionid هنا..." 
                        class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 text-slate-200">
                </div>
                
                <button onclick="verifySession()" id="verifyBtn"
                    class="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold py-3 rounded-xl transition shadow-lg cursor-pointer">
                    ربط الحساب الحقيقي
                </button>
            </div>

            <!-- بطاقة الحساب الحقيقي -->
            <div id="profileSection" class="hidden space-y-4 mt-4">
                <div class="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center space-x-4 space-x-reverse">
                    <img id="userAvatar" src="" alt="صورة الحساب" class="w-16 h-16 rounded-full border-2 border-cyan-500 object-cover">
                    <div class="overflow-hidden">
                        <h2 id="userNickname" class="font-bold text-base text-white truncate"></h2>
                        <p id="userUniqueId" class="text-xs text-cyan-400 truncate"></p>
                        <div class="flex space-x-3 space-x-reverse mt-2 text-xs text-slate-300">
                            <span>المتابعين: <strong id="followerCount" class="text-white">0</strong></span>
                            <span>يتابع: <strong id="followingCount" class="text-white">0</strong></span>
                        </div>
                    </div>
                </div>

                <button onclick="startCleaning()" id="cleanBtn"
                    class="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-rose-900/25 cursor-pointer">
                    🗑️ بدء حذف الريبوستات الفعلي
                </button>
            </div>

            <div id="statusBox" class="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 hidden">
                <p id="statusText" class="font-mono text-center text-cyan-300"></p>
            </div>
        </div>

        <script>
            let currentSessionId = '';

            async function verifySession() {
                const sessionId = document.getElementById('sessionId').value.trim();
                const statusBox = document.getElementById('statusBox');
                const statusText = document.getElementById('statusText');
                const btn = document.getElementById('verifyBtn');

                if (!sessionId) {
                    alert('الرجاء إدخال الـ Session ID!');
                    return;
                }

                statusBox.classList.remove('hidden');
                statusText.innerText = 'جاري التحقق من الحساب وسحب البيانات الحقيقية من تيك توك...';
                btn.disabled = true;
                btn.classList.add('opacity-50');

                try {
                    const response = await fetch('/api/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sessionId })
                    });

                    const data = await response.json();
                    if (data.success) {
                        currentSessionId = sessionId;
                        statusBox.classList.add('hidden');
                        document.getElementById('loginSection').classList.add('hidden');
                        
                        document.getElementById('userAvatar').src = data.userInfo.avatar;
                        document.getElementById('userNickname').innerText = data.userInfo.nickname;
                        document.getElementById('userUniqueId').innerText = '@' + data.userInfo.uniqueId;
                        document.getElementById('followerCount').innerText = data.userInfo.followerCount;
                        document.getElementById('followingCount').innerText = data.userInfo.followingCount;
                        
                        document.getElementById('profileSection').classList.remove('hidden');
                    } else {
                        statusBox.classList.remove('hidden');
                        statusText.innerText = '❌ خطأ: ' + data.message;
                    }
                } catch (err) {
                    statusBox.classList.remove('hidden');
                    statusText.innerText = '❌ خطأ في الاتصال بالسيرفر.';
                } finally {
                    btn.disabled = false;
                    btn.classList.remove('opacity-50');
                }
            }

            async function startCleaning() {
                const statusBox = document.getElementById('statusBox');
                const statusText = document.getElementById('statusText');
                const btn = document.getElementById('cleanBtn');

                statusBox.classList.remove('hidden');
                statusText.innerText = 'جاري رصد وحذف الريبوستات من حسابك...';
                btn.disabled = true;
                btn.classList.add('opacity-50');

                try {
                    const response = await fetch('/api/clean', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sessionId: currentSessionId })
                    });

                    const data = await response.json();
                    statusText.innerText = (data.success ? '✅ ' : '❌ ') + data.message;
                } catch (err) {
                    statusText.innerText = '❌ حدث خطأ أثناء الحذف.';
                } finally {
                    btn.disabled = false;
                    btn.classList.remove('opacity-50');
                }
            }
        </script>
    </body>
    </html>
  `);
});

app.post('/api/verify', async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) return res.json({ success: false, message: 'مطلوب إدخال الكوكيز.' });

  try {
    const response = await axios.get('https://www.tiktok.com/passport/web/account/info/', {
      headers: {
        'Cookie': `sessionid=${sessionId}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://www.tiktok.com/'
      },
      validateStatus: () => true
    });

    if (response.status === 200 && response.data && response.data.data) {
      const u = response.data.data;
      return res.json({
        success: true,
        userInfo: {
          nickname: u.screen_name || u.username || 'حساب تيك توك',
          uniqueId: u.unique_id || 'user',
          avatar: u.avatar_url || 'https://sf16-ies-music-va.ibytedns.com/obj/ies-music-va/7311746211568287750',
          followerCount: u.follower_count || 0,
          followingCount: u.following_count || 0
        }
      });
    }

    // نقطة تحقق بديلة
    const alt = await axios.get('https://www.tiktok.com/api/user/detail/?aid=1988', {
      headers: { 'Cookie': `sessionid=${sessionId}`, 'User-Agent': 'Mozilla/5.0' },
      validateStatus: () => true
    });

    if (alt.status === 200 && alt.data && alt.data.userInfo) {
      const u = alt.data.userInfo.user;
      const s = alt.data.userInfo.stats;
      return res.json({
        success: true,
        userInfo: {
          nickname: u.nickname || 'حساب تيك توك',
          uniqueId: u.uniqueId || 'user',
          avatar: u.avatarLarger || '',
          followerCount: s.followerCount || 0,
          followingCount: s.followingCount || 0
        }
      });
    }

    res.json({ success: false, message: 'الـ Session ID غير صحيح أو منتهي الصلاحية.' });
  } catch (e) {
    res.json({ success: false, message: 'رفضت حماية تيك توك الطلب. تأكد من صحة الكوكيز.' });
  }
});

app.post('/api/clean', async (req, res) => {
  const { sessionId } = req.body;
  try {
    const listRes = await axios.get('https://www.tiktok.com/api/item/list/?count=30&type=4&aid=1988', {
      headers: { 'Cookie': `sessionid=${sessionId}`, 'User-Agent': 'Mozilla/5.0' },
      validateStatus: () => true
    });

    if (listRes.data && listRes.data.itemList) {
      const items = listRes.data.itemList;
      if (items.length === 0) return res.json({ success: true, message: 'لا توجد ريبوستات لحذفها، حسابك نظيف تماماً!' });

      for (let item of items) {
        await axios.post('https://www.tiktok.com/api/repost/item/?aid=1988', { aweme_id: item.id, type: 2 }, {
          headers: { 'Cookie': `sessionid=${sessionId}`, 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.tiktok.com/' },
          validateStatus: () => true
        });
      }
      return res.json({ success: true, message: `تم بنجاح حذف جميع الريبوستات الظاهرة (${items.length} ريبوست)!` });
    }
    res.json({ success: false, message: 'تعذر جلب قائمة الريبوستات.' });
  } catch (e) {
    res.json({ success: false, message: 'حدث خطأ أثناء الاتصال لتنفيذ الحذف.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

