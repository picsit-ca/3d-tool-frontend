// bien toan cau
const BLOCKS_PER_TOKEN = 1000;
let CURRENT_FILE_DATA = null; 
let CURRENT_COST = 0;       

function getTokens() {
  if (!window.USER) return 0;
  return 9999;
}

async function updateTokenUI() {
  const res = await fetch('https://threed-tool-backend.onrender.com/me', {
    credentials: 'include'
  })
  const data = await res.json()

  document.getElementById('tokenInfo').textContent =
    `Tokens: ${data.tokens} | Blocks: ${data.totalBlocks}`
}

// dang nhap google
function parseJwt(token){
  return JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
}

async function onGoogleLogin(res){
  const p = parseJwt(res.credential);
  window.USER = { id:p.sub, email:p.email, name:p.name };

  document.getElementById("loginStatus").textContent = "Xin chào, " + p.name;
  document.querySelector(".g_id_signin").style.display = "none";

  // 🔥 LOGIN BACKEND (QUAN TRỌNG NHẤT)
  await fetch('https://threed-tool-backend.onrender.com/login', {
    method: 'POST',
    credentials: 'include'
  });

  updateTokenUI();

  if(CURRENT_FILE_DATA) updateConvertButton();
}

// lay thuoc tinh block
const BlockColor={
  "#FFCDD2":{id:668,data:1},
  "#273238":{id:682,data:11}
};

function nearestColor(r,g,b){
  let best={id:667,data:0},dist=1e9;
  for(const h in BlockColor){
    const R=parseInt(h.substr(1,2),16),
          G=parseInt(h.substr(3,2),16),
          B=parseInt(h.substr(5,2),16);
    const d=(r-R)**2+(g-G)**2+(b-B)**2;
    if(d<dist){dist=d;best=BlockColor[h];}
  }
  return best;
}

// ui
const upload = document.getElementById("uploadBox");
const fileInput = document.getElementById("jsonFile");
const fileName = document.getElementById("fileName");
const convertBtn = document.getElementById("convertBtn");
const copyBtn = document.getElementById("copyBtn");
const output = document.getElementById("output");
const notify = document.getElementById("notify");

upload.onclick = () => fileInput.click();

// doc file
fileInput.onchange = () => {
  const file = fileInput.files[0];
  if(!file) return;
  
  fileName.textContent = file.name;
  convertBtn.textContent = "Đang phân tích...";
  convertBtn.disabled = true;

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const json = JSON.parse(e.target.result);
      if(!json.voxels) throw "File JSON không đúng định dạng (thiếu voxels)";
      
      CURRENT_FILE_DATA = json.voxels;
      
      const blockCount = CURRENT_FILE_DATA.length;
      CURRENT_COST = Math.ceil(blockCount / BLOCKS_PER_TOKEN);
      
      updateConvertButton(blockCount);

    } catch(err) {
      showNotify("Lỗi file: " + err, false);
      convertBtn.textContent = "FILE LỖI";
      CURRENT_FILE_DATA = null;
    }
  };
  reader.readAsText(file);
};

function updateConvertButton(count){
  if(!window.USER) {
    convertBtn.textContent = "VUI LÒNG ĐĂNG NHẬP TRƯỚC";
    convertBtn.disabled = true;
    return;
  }
  if(!CURRENT_FILE_DATA) return;

  const userTokens = getTokens();
  const canAfford = userTokens >= CURRENT_COST;

  convertBtn.disabled = !canAfford;
  
  if(canAfford){
    convertBtn.innerHTML = `CHUYỂN ĐỔI NGAY <br><span style="font-size:14px; font-weight:normal">(Tiêu tốn: ${CURRENT_COST} Token cho ${count} blocks)</span>`;
    convertBtn.style.background = "linear-gradient(90deg, #2196f3, #21cbf3)";
  } else {
    convertBtn.innerHTML = `KHÔNG ĐỦ TOKEN <br><span style="font-size:14px; font-weight:normal">(Cần ${CURRENT_COST} - Bạn có ${userTokens})</span>`;
    convertBtn.style.background = "#555";
  }
}

function showNotify(msg, ok){
  notify.style.display = "block";
  notify.className = "notify " + (ok?"success":"error");
  notify.textContent = msg;
  setTimeout(()=> notify.style.display="none", 3000);
}

// chuyen doi
convertBtn.onclick = async function () {
  convertBtn.disabled = true
  convertBtn.textContent = "ĐANG XỬ LÝ..."

  try {
    const res = await fetch('https://threed-tool-backend.onrender.com/convert', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        blocks: TOTAL_BLOCKS
      })
    })

    const data = await res.json()

    if (!data.success) {
      showNotify(data.error || 'Lỗi server', false)
      return
    }

    showNotify(data.message, true)
  } catch (e) {
    showNotify('Không kết nối được server', false)
  } finally {
    convertBtn.disabled = false
    convertBtn.textContent = "CONVERT"
  }
}

copyBtn.onclick = () => {
  navigator.clipboard.writeText(output.textContent);
  showNotify("Đã copy script vào bộ nhớ tạm!", true);
};