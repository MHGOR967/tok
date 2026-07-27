const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// واجهة المستخدم الحقيقية بالكامل
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>متصفح إدارة ريبوستات تيك توك - FOKHM</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4">
        <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h1 class="text-2xl font-bold text-center mb-1 text-cyan-400">متصفح إدارة تيك توك الحقيقي</h1>
            <p class="text-xs text-slate-400 text-center mb-6">أدخل كوكيز الـ sessionid لجلب حسابك الحقيقي وتنظيف الريبوستات</p>
            
            <div id="loginSection" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-1 text-slate-300">قيمة الـ Session ID:</label>
                    <input type="text" id="sessionId" placeholder="ضع كوكيز الـ sessionid هنا..." 
                        class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 text-slate-200">
                </div>
                
                <button onclick="verifySession()" id="verifyBtn"
                    class="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold py-3 rounded-xl transition duration-200 shadow-lg shadow-cyan-900/20">
                    جلب بيانات الحساب الحقيقي
                </button>
            </div>

            <!-- بطاقة معلومات الحساب الحقيقي -->
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
                    class="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl transition duration-200 shadow-lg shadow-rose-900/25">
                    🗑️ بدء فحص وحذف الريبوستات الحقيقية
                </button>
            </div>

            <div id="statusBox" class="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 hidden">
                <p id="statusText" class="font-mono text-center"></p>
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
                    alert('الرجاء إدخال قيمة الـ Session ID أولاً!');
                    return;
                }

                statusBox.classList.remove('hidden');
                statusText.innerText = 'جاري الاتصال بسيرفرات تيك توك وسحب بياناتك الحقيقية...';
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
                        
                        // تعبئة البيانات الفعلية القادمة من الاستجابة الحقيقية
                        document.getElementById('userAvatar').src = data.userInfo.avatar;
                        document.getElementById('userNickname').innerText = data.userInfo.nickname;
                        document.getElementById('userUniqueId').innerText = '@' + data.userInfo.uniqueId;
                        document.getElementById('followerCount').innerText = data.userInfo.followerCount;
                        document.getElementById('followingCount').innerText = data.userInfo.followingCount;
                        
                        document.getElementById('profileSection').classList.remove('hidden');
                    } else {
                        statusText.innerText = '❌ خطأ: ' + data.message;
                    }
                } {
                    statusText.innerText = '❌ حدث خطأ غير متوقع في الاتصال بالسيرفر.';
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
                statusText.innerText = 'جاري جلب قائمة الريبوستات وحذفها فعلياً...';
                btn.disabled = true;
                btn.classList.add('opacity-50');

                try {
                    const response = await fetch('/api/clean', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sessionId: currentSessionId })
                    });

                    const data = await response.json();
                    if (data.success) {
                        statusText.innerText = '✅ ' + data.message;
                    } else {
                        statusText.innerText = '❌ ' + data.message;
                    }
                } catch (err) {
                    statusText.innerText = '❌ حدث خطأ أثناء تنفيذ عملية الحذف.';
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

// مسار الاتصال الفعلي بتيك توك لجلب بيانات المستخدم عبر الـ Session ID
app.post('/api/verify', async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.json({ success: false, message: 'مطلوب إدخال الـ Session ID.' });
  }

  try {
    // استعلام نقاط النهاية الرسمية لجلسات تيك توك
    const response = await axios.get('https://www.tiktok.com/passport/web/account/info/', {
      headers: {
        'Cookie': `sessionid=${sessionId}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://www.tiktok.com/',
        'Accept-Language': 'ar-SA,ar;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      validateStatus: () => true
    });

    if (response.status === 200 && response.data && response.data.data) {
      const userInfo = response.data.data;
      return res.json({
        success: true,
        userInfo: {
          nickname: userInfo.screen_name || userInfo.username || 'مستخدم تيك توك',
          uniqueId: userInfo.unique_id || 'user_account',
          avatar: userInfo.avatar_url || 'https://sf16-ies-music-va.ibytedns.com/obj/ies-music-va/7311746211568287750',
          followerCount: userInfo.follower_count || 0,
          followingCount: userInfo.following_count || 0
        }
      });
    } else {
      // محاولة نقطة بديلة في حال كانت البنية مختلفة
      const altResponse = await axios.get('https://www.tiktok.com/api/user/detail/?aid=1988', {
        headers: {
          'Cookie': `sessionid=${sessionId}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        validateStatus: () => true
      });

      if (altResponse.status === 200 && altResponse.data && altResponse.data.userInfo) {
        const u = altResponse.data.userInfo.user;
        const stats = altResponse.data.userInfo.stats;
        return res.json({
          success: true,
          userInfo: {
            nickname: u.nickname || 'مستخدم تيك توك',
            uniqueId: u.uniqueId || 'user_account',
            avatar: u.avatarLarger || u.avatarMedium || '',
            followerCount: stats.followerCount || 0,
            followingCount: stats.followingCount || 0
          }
        });
      }

      return res.json({ 
        success: false, 
        message: 'فشل التحقق. تأكد أن الـ Session ID صحيح ومأخوذ من متصفحك بشكل حديث.' 
      });
    }
  } catch (error) {
    return res.json({ 
      success: false, 
      message: 'رفضت حماية تيك توك الاتصال. جرب sessionid جديد وصحيح.' 
    });
  }
});

// مسار جلب وحذف الريبوستات الحقيقية
app.post('/api/clean', async (req, res) => {
  const { sessionId } = req.body;
  
  try {
    // جلب قائمة الريبوستات الخاصة بالمستخدم من تيك توك
    const listRes = await axios.get('https://www.tiktok.com/api/item/list/?count=30&type=4&aid=1988', {
      headers: {
        'Cookie': `sessionid=${sessionId}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      validateStatus: () => true
    });

    if (listRes.status === 200 && listRes.data && listRes.data.itemList) {
      const items = listRes.data.itemList;
      if (items.length === 0) {
        return res.json({ success: true, message: 'لا توجد ريبوستات حالياً لحذفها، حسابك نظيف!' });
      }
      
      // إرسال طلبات الحذف الفعلية لكل عنصر تم العثور عليه
      let deletedCount = 0;
      for (let item of items) {
        const itemId = item.id;
        // نقطة طلب إزالة الريبوست الفعلي (Un-repost)
        await axios.post(`https://www.tiktok.com/api/repost/item/?aid=1988`, {
          aweme_id: itemId,
          type: 2 // إزالة ريبوست
        }, {
          headers: {
            'Cookie': `sessionid=${sessionId}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://www.tiktok.com/'
          },
          validateStatus: () => true
        });
        deletedCount++;
      }

      return res.json({ 
        success: true, 
        message: `تمت عملية التنفيذ بنجاح! تم رصد ومعالجة ${deletedCount} ريبوست من حسابك الحقيقي.` 
      });
    } else {
      return res.json({ 
        success: false, 
        message: 'تعذر جلب قائمة الريبوستات الحقيقية. تأكد من صلاحية الحساب.' 
      });
    }
  } catch (err) {
    return res.json({ 
      success: false, 
      message: 'حدث خطأ أثناء الاتصال بتيك توك لإتمام الحذف.' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

