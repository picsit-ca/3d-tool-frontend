// bien toan cau
const BLOCKS_PER_TOKEN = 1000;
let CURRENT_FILE_DATA = null; 
let CURRENT_COST = 0;      
let USER_BLOCKS = 0;
let USER_TOKENS = 0; 

window.AUTH_USER = null;
window.ME = null;

let isConverting = false;
let abortController = null;

let products = [
  {
    Pid: "01",
    Pavatar: "images/token.png",
    Pname: "Small Tokens Pack",
    Pprices: "10.000 VND",
    Ptokens: 10
  },
  {
    Pid: "02",
    Pavatar: "images/token.png",
    Pname: "Medium Tokens Pack",
    Pprices: "20.000 VND",
    Ptokens: 25
  },
  {
    Pid: "03",
    Pavatar: "images/token.png",
    Pname: "Big Tokens Pack",
    Pprices: "50.000 VND",
    Ptokens: 75
  },
  {
    Pid: "04",
    Pavatar: "images/token.png",
    Pname: "Super Tokens Pack",
    Pprices: "100.000 VND",
    Ptokens: 150
  },
]

async function updateTokenUI(retryCount = 0) {
  const el = document.getElementById('tokenUI');
  const overlay = document.getElementById('loadingOverlay');
  const statusTxt = document.getElementById('loadStatus');

  try {
    const res = await fetch('https://threed-tool-backend.onrender.com/me', {
      credentials: 'include'
    });

    if (res.ok) {
      const data = await res.json();
      window.ME = data;
      USER_TOKENS = data.tokens;
      el.innerHTML = `<div style="font-weight:bold">Tokens: ${USER_TOKENS} 🪙</div>`;
      
      overlay.style.display = 'none'; 
    } else if (res.status === 401) {
        // Not logged in, don't retry
        window.ME = null;
        overlay.style.display = 'none';
        el.innerHTML = `<div style="color:#aaa; font-style:italic">Vui lòng đăng nhập để xem Token</div>`;
    } 
    else {
      // Other server errors, retry
      throw new Error(`Server error: ${res.status}`);
    }
  } catch (err) {
    console.log(`Error fetching token (attempt ${retryCount + 1}):`, err.message);
    if (retryCount < 30) { 
      statusTxt.innerText = `Đang kết nối lại máy chủ... (${retryCount + 1}/30)`;
      setTimeout(() => updateTokenUI(retryCount + 1), 3000);
    } else {
      overlay.style.display = 'none';
      el.innerHTML = `<div style="color:red">Không thể kết nối tới máy chủ. Vui lòng tải lại trang (F5).</div>`;
    }
  }
}

let MyBank = {
  BANK_ID: "BAB",
  ACCOUNT_NO: "050001060015835", // pls donate tui xai Bac A Bank=)
}

function scrollToShop() {
  const shopDiv = document.getElementById('shopSection');
  shopDiv.scrollIntoView({ behavior: 'smooth' });
}

const modal = document.getElementById("paymentModal");
const payNameEl = document.getElementById("payName");
const payPriceEl = document.getElementById("payPrice");
const transContentEl = document.getElementById("transContent");
const qrImage = document.getElementById("qrImage");

function buyItem(itemName, priceText, productId) {
  if (!window.AUTH_USER?.id) {
    alert("Vui lòng đăng nhập Google trước");
    return;
  }

  if (!window.ME) {
    alert("Đang đồng bộ tài khoản, vui lòng chờ 1 chút");
    return;
  }

  const userId = window.AUTH_USER.id;

  payNameEl.textContent = itemName;
  payPriceEl.textContent = priceText;

  const amount = Number(priceText.replace(/[^\d]/g, ''));
  const orderId = "O" + Date.now();

  const addInfo = `P${productId}U${userId}${orderId}`;

  transContentEl.textContent = addInfo;

  const qr = `https://img.vietqr.io/image/${MyBank.BANK_ID}-${MyBank.ACCOUNT_NO}-qr_only.png` +
             `?amount=${amount}&addInfo=${encodeURIComponent(addInfo)}`;

  qrImage.src = qr;
  modal.style.display = "block";
}

// dong chuyen khoan
function closeModal() {
  modal.style.display = "none";
}

// dong chuyen khoan khi click ra ngoai
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}

// dang nhap google
function parseJwt(token){
  return JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
}

async function onGoogleLogin(res){
  const p = parseJwt(res.credential);
  window.AUTH_USER = { id:p.sub, email:p.email, name:p.name };

  document.getElementById("loginStatus").textContent = "Xin chào, " + p.name;
  document.querySelector(".g_id_signin").style.display = "none";

  try {
    // LOGIN BACKEND
    const loginRes = await fetch('https://threed-tool-backend.onrender.com/login', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId: p.sub })
    });

    if (!loginRes.ok) {
        console.error("Login backend thất bại");
        return;
    }
    
    setTimeout(() => {
        updateTokenUI();
        if(CURRENT_FILE_DATA) updateConvertButton();
    }, 500); 

  } catch (e) {
    console.error("Lỗi mạng khi login:", e);
  }
}

// lay thuoc tinh block
const BlockColor={
  "#FFCDD2":{id:668,data:1},
  "#273238":{id:682,data:11}
};

const scriptRoot = `
ScriptSupportEvent:registerEvent("Game.AnyPlayer.EnterGame", function(e)
    local _, u = Player:getHostUin()
    uin = u
    Player:gainItems(uin, 959, 1, 1)
    Game:msgBox([[Đặt khối gia củ rồi nhấp để dựng mô hình!
Chỉnh tầm nhìn xa nhất để tránh bị lỗi!]])
end)

ScriptSupportEvent:registerEvent("Player.ClickBlock", function(e)
    if e.blockid == 959 then
    local x, y, z = e.x, e.y, e.z
    Block:destroyBlock(x, y, z, false)
    Player:setPosition(e.eventobjid, x + X_CENTER, y + Y_CENTER, z + Z_CENTER)
    Player:setActionAttrState(e.eventobjid, 1, false)

    for _, b in ipairs(blocks) do
        Block:setBlockAll(
        b[1] + x,
        b[2] + y,
        b[3] + z,
        b[4],
        b[5]
        )
    end

    Game:msgBox("Đã dựng mô hình thành công!")
    Player:setActionAttrState(e.eventobjid, 1, true)
    end
end)
`

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

function convertToLua() {
  try {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    const blocks = CURRENT_FILE_DATA.map(v => {
      const hex = "#" + [v.red, v.green, v.blue]
        .map(x => (+x).toString(16).padStart(2, "0").toUpperCase())
        .join("");

      const bc = BlockColor[hex] || nearestColor(v.red, v.green, v.blue);

      const blockX = -v.x;
      const blockY = v.y;
      const blockZ = v.z;

      minX = Math.min(minX, blockX);
      maxX = Math.max(maxX, blockX);
      minY = Math.min(minY, blockY);
      maxY = Math.max(maxY, blockY);
      minZ = Math.min(minZ, blockZ);
      maxZ = Math.max(maxZ, blockZ);

      return { x: blockX, y: blockY, z: blockZ, id: bc.id, data: bc.data };
    });

    const X_CENTER = Math.floor((minX + maxX) / 2);
    const Y_CENTER = maxY;
    const Z_CENTER = Math.floor((minZ + maxZ) / 2);

    const lua = `-- hu
-- Total Blocks: ${blocks.length}
local X_CENTER = ${X_CENTER}
local Y_CENTER = ${Y_CENTER}
local Z_CENTER = ${Z_CENTER}
blocks={
${blocks.map(b =>
  `{${b.x},${b.y},${b.z},${b.id},${b.data}}`
).join(",\n")}
}`;

    output.textContent = lua + scriptRoot;
    copyBtn.disabled = false;
    showNotify("✅ Chuyển đổi thành công!", true);

  } catch (err) {
    showNotify("Lỗi convert: " + err, false);
  }
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

function updateConvertButton(count) {
  if (!window.ME) {
    convertBtn.textContent = "VUI LÒNG ĐĂNG NHẬP TRƯỚC";
    convertBtn.disabled = true;
    return;
  }
  if (!CURRENT_FILE_DATA) return;

  const canAfford = USER_TOKENS >= CURRENT_COST;

  convertBtn.disabled = !canAfford;
  
  if (canAfford) {
    convertBtn.innerHTML = `CHUYỂN ĐỔI NGAY <br><span style="font-size:14px; font-weight:normal">(Tiêu tốn: ${CURRENT_COST} Token cho ${count} blocks)</span>`;
    convertBtn.style.background = "linear-gradient(90deg, #2196f3, #21cbf3)";
  } else {

    convertBtn.innerHTML = `KHÔNG ĐỦ TOKEN <br><span style="font-size:14px; font-weight:normal">(Cần ${CURRENT_COST} Token - Bạn chỉ có ${USER_TOKENS})</span>`;
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
convertBtn.onclick = async () => {
  // 1️⃣ nếu đang convert thì coi như HỦY
  if (isConverting) {
    abortController.abort();
    return;
  }

  // xac nhan file lon
  if (CURRENT_COST >= 10) {
    const ok = confirm(
      `🤓 Model này sẽ tốn ${CURRENT_COST} Token.\n\n` +
      `Model này khá lớn đó bạn muốn tiếp tục không?(ok để tiếp tục)`
    );
    if (!ok) {
      console.log('Người dùng dừng convert');
      return;
    }
  }
  else if (CURRENT_COST < 5) {
    const ok = confirm(
      `🤓 Model này sẽ tốn ${CURRENT_COST} Token.\n\n` +
      `Model này hơi nhỏ nhỉ bạn muốn tiếp tục không?(ok để tiếp tục)`
    );
    if (!ok) {
      console.log('Người dùng muốn chỉnh kích thước file');
      return;
    }
  }

  // converting
  isConverting = true;
  abortController = new AbortController();

  convertBtn.disabled = false;
  convertBtn.textContent = "ĐANG CHUYỂN ĐỔI... (Nhấn để hủy)";

  try {
    const res = await fetch(
      'https://threed-tool-backend.onrender.com/convert',
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blocks: CURRENT_FILE_DATA.length
        }),
        signal: abortController.signal
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'Convert thất bại');
      return;
    }

    alert('Convert thành công!');
    await updateTokenUI();

    convertToLua()

  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('Convert bị hủy');
    } else {
      alert('Lỗi server');
    }
  } finally {
    isConverting = false;
    abortController = null;
    updateConvertButton(CURRENT_FILE_DATA.length);
  }
};

copyBtn.onclick = () => {
  navigator.clipboard.writeText(output.textContent);
  showNotify("Đã copy script vào bộ nhớ tạm!", true);
};

document.addEventListener("DOMContentLoaded", () => {
  const productInner = document.querySelector(".product-grid");
  let productRenderUI = "";

  products.forEach((item, index) => {
    productRenderUI += `
      <div class="product-card">
        <img src="${item.Pavatar}" alt="${item.Pname}" class="product-img">
        <div class="product-name">${item.Pname}<br>(+${item.Ptokens} Tokens)</div>
        <div class="product-price">${item.Pprices}</div>
        <button class="btn-buy" onclick="buyItem('${item.Pname}', '${item.Pprices}', '${item.Pid}')">Mua Ngay</button>
      </div>
    `;
  });

  productInner.innerHTML = productRenderUI;
  updateTokenUI();
})