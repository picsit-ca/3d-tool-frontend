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
    } else {
      // loi nhung server phan hoi -> Tat loading
      window.ME = null;
      overlay.style.display = 'none';
      el.innerHTML = `<div style="color:#aaa; font-style:italic">Vui lòng đăng nhập để xem Token</div>`;
    }
  } catch (err) {
    console.log("Server is sleeping, retrying...");
    if (retryCount < 10) { //~30s
      statusTxt.innerText = `Đang khởi động máy chủ... (${retryCount + 1}/10)`;
      setTimeout(() => updateTokenUI(retryCount + 1), 3000);
    } else {
      // neu qua lau van cho vao nhung bao loi
      overlay.style.display = 'none';
      el.innerHTML = `<div style="color:red">Server bận, hãy thử tải lại trang (F5)</div>`;
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
      credentials: 'include'
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
const BlockColor = {
    "#FFCDD2": { id: 668, data: 1 },
    "#EE9A9A": { id: 668, data: 2 },
    "#E57373": { id: 669, data: 4 },
    "#EE534F": { id: 670, data: 6 },
    "#F44236": { id: 671, data: 8 },
    "#E53935": { id: 672, data: 10 },
    "#D32F2E": { id: 673, data: 12 },
    "#C62827": { id: 681, data: 0 },
    "#B61C1C": { id: 677, data: 10 },
    "#D50100": { id: 677, data: 2 },
    "#FE1743": { id: 678, data: 4 },
    "#FF5353": { id: 679, data: 6 },
    "#FF8A80": { id: 680, data: 8 },
    "#FDE0E4": { id: 681, data: 10 },
    "#F9BBD0": { id: 667, data: 1 },
    "#F48FB1": { id: 668, data: 3 },
    "#F06292": { id: 673, data: 0 },
    "#EC407A": { id: 670, data: 7 },
    "#EA1E63": { id: 671, data: 9 },
    "#D81A60": { id: 672, data: 11 },
    "#C2175B": { id: 673, data: 13 },
    "#AD1457": { id: 674, data: 15 },
    "#890E4F": { id: 676, data: 1 },
    "#C41162": { id: 677, data: 3 },
    "#F40057": { id: 678, data: 5 },
    "#FF4181": { id: 679, data: 7 },
    "#FF80AB": { id: 680, data: 9 },
    "#F9D8E3": { id: 681, data: 11 },
    "#E1BEE8": { id: 667, data: 2 },
    "#CF93D9": { id: 668, data: 4 },
    "#B968C7": { id: 669, data: 6 },
    "#AA47BC": { id: 670, data: 8 },
    "#9C28B1": { id: 669, data: 0 },
    "#8E24AA": { id: 672, data: 12 },
    "#7A1FA2": { id: 673, data: 14 },
    "#6A1B9A": { id: 677, data: 0 },
    "#4A148C": { id: 1970, data: 0 },
    "#AA00FF": { id: 677, data: 4 },
    "#D500FA": { id: 678, data: 6 },
    "#E040FC": { id: 679, data: 8 },
    "#EA80FC": { id: 680, data: 10 },
    "#EFD4F3": { id: 681, data: 12 },
    "#D0C4E8": { id: 667, data: 3 },
    "#B39DDB": { id: 1966, data: 0 },
    "#9675CE": { id: 669, data: 7 },
    "#7E57C2": { id: 670, data: 9 },
    "#673BB7": { id: 671, data: 11 },
    "#5D35B0": { id: 672, data: 13 },
    "#512DA7": { id: 673, data: 15 },
    "#45289F": { id: 675, data: 1 },
    "#301B92": { id: 1962, data: 0 },
    "#6200E9": { id: 677, data: 5 },
    "#651EFE": { id: 678, data: 7 },
    "#7C4DFF": { id: 679, data: 9 },
    "#B388FE": { id: 680, data: 11 },
    "#E8E0F7": { id: 681, data: 13 },
    "#C5CAE8": { id: 667, data: 4 },
    "#9EA8DB": { id: 668, data: 6 },
    "#7986CC": { id: 669, data: 8 },
    "#5C6BC0": { id: 670, data: 10 },
    "#3F51B5": { id: 671, data: 12 },
    "#3949AB": { id: 672, data: 14 },
    "#303E9F": { id: 675, data: 15 },
    "#283593": { id: 675, data: 2 },
    "#1A237E": { id: 1968, data: 0 },
    "#304FFF": { id: 677, data: 6 },
    "#3D5AFE": { id: 678, data: 8 },
    "#536DFE": { id: 679, data: 10 },
    "#8C9EFF": { id: 680, data: 12 },
    "#DFE2F5": { id: 681, data: 14 },
    "#BBDEFA": { id: 667, data: 5 },
    "#90CAF8": { id: 670, data: 0 },
    "#64B5F6": { id: 669, data: 9 },
    "#42A5F6": { id: 670, data: 11 },
    "#2196F3": { id: 671, data: 13 },
    "#1D89E4": { id: 678, data: 0 },
    "#1976D3": { id: 674, data: 1 },
    "#1564C0": { id: 675, data: 3 },
    "#0E47A1": { id: 676, data: 5 },
    "#2A62FF": { id: 677, data: 7 },
    "#2879FE": { id: 678, data: 9 },
    "#438AFE": { id: 679, data: 11 },
    "#82B1FF": { id: 680, data: 13 },
    "#D7EAFB": { id: 681, data: 15 },
    "#B3E5FC": { id: 667, data: 6 },
    "#81D5FA": { id: 668, data: 8 },
    "#4FC2F8": { id: 669, data: 10 },
    "#28B6F6": { id: 670, data: 12 },
    "#03A9F5": { id: 671, data: 14 },
    "#039BE6": { id: 669, data: 5 },
    "#0288D1": { id: 674, data: 2 },
    "#0277BD": { id: 675, data: 4 },
    "#00579C": { id: 676, data: 6 },
    "#0091EA": { id: 677, data: 8 },
    "#00AFFE": { id: 678, data: 10 },
    "#3FC4FF": { id: 679, data: 12 },
    "#80D8FE": { id: 680, data: 14 },
    "#D9F4FF": { id: 675, data: 12 },
    "#B2EBF2": { id: 667, data: 7 },
    "#80DEEA": { id: 668, data: 9 },
    "#4DD0E2": { id: 669, data: 11 },
    "#25C6DA": { id: 670, data: 13 },
    "#00BCD5": { id: 671, data: 15 },
    "#00ACC2": { id: 673, data: 1 },
    "#0098A6": { id: 674, data: 3 },
    "#00828F": { id: 675, data: 5 },
    "#016064": { id: 676, data: 7 },
    "#00B8D4": { id: 677, data: 9 },
    "#00E5FF": { id: 678, data: 11 },
    "#17FFFF": { id: 679, data: 13 },
    "#83FFFF": { id: 680, data: 15 },
    "#D2F5F9": { id: 682, data: 1 },
    "#B2DFDC": { id: 667, data: 8 },
    "#80CBC4": { id: 668, data: 10 },
    "#4CB6AC": { id: 669, data: 12 },
    "#26A59A": { id: 670, data: 14 },
    "#009788": { id: 672, data: 3 },
    "#00887A": { id: 673, data: 2 },
    "#00796A": { id: 674, data: 4 },
    "#00695A": { id: 675, data: 6 },
    "#004C3F": { id: 676, data: 8 },
    "#01BFA5": { id: 676, data: 0 },
    "#1DE9B6": { id: 678, data: 12 },
    "#64FEDA": { id: 679, data: 14 },
    "#A7FEEB": { id: 674, data: 14 },
    "#D1EFED": { id: 682, data: 2 },
    "#C8E6CA": { id: 667, data: 9 },
    "#A5D6A7": { id: 668, data: 11 },
    "#80C783": { id: 669, data: 13 },
    "#66BB6A": { id: 670, data: 15 },
    "#4CB050": { id: 672, data: 1 },
    "#43A047": { id: 673, data: 3 },
    "#398E3D": { id: 674, data: 5 },
    "#2F7D32": { id: 680, data: 0 },
    "#1C5E20": { id: 1971, data: 0 },
    "#01C853": { id: 677, data: 11 },
    "#00E676": { id: 678, data: 13 },
    "#69F0AE": { id: 679, data: 15 },
    "#B9F6CA": { id: 681, data: 1 },
    "#DCF1DE": { id: 682, data: 3 },
    "#DDEDC8": { id: 667, data: 10 },
    "#C5E1A6": { id: 668, data: 12 },
    "#AED582": { id: 669, data: 14 },
    "#9CCC66": { id: 680, data: 3 },
    "#8BC24A": { id: 672, data: 2 },
    "#7DB343": { id: 673, data: 4 },
    "#689F39": { id: 674, data: 6 },
    "#548B2E": { id: 675, data: 8 },
    "#33691E": { id: 676, data: 10 },
    "#64DD16": { id: 677, data: 12 },
    "#76FF02": { id: 678, data: 14 },
    "#B2FF59": { id: 675, data: 7 },
    "#CDFF90": { id: 681, data: 2 },
    "#ECF9DF": { id: 682, data: 4 },
    "#F0F4C2": { id: 667, data: 11 },
    "#E6EE9B": { id: 668, data: 13 },
    "#DDE776": { id: 669, data: 15 },
    "#D4E056": { id: 671, data: 1 },
    "#CDDC39": { id: 672, data: 0 },
    "#C0CA33": { id: 673, data: 5 },
    "#B0B42B": { id: 674, data: 7 },
    "#9E9E24": { id: 675, data: 9 },
    "#817716": { id: 1967, data: 0 },
    "#AEEA00": { id: 1963, data: 0 },
    "#C6FF00": { id: 678, data: 15 },
    "#EEFF41": { id: 680, data: 1 },
    "#F4FE81": { id: 681, data: 3 },
    "#F7FADB": { id: 682, data: 5 },
    "#FFFAC3": { id: 667, data: 12 },
    "#FFF59C": { id: 668, data: 14 },
    "#FFF176": { id: 1964, data: 0 },
    "#FFEE58": { id: 671, data: 2 },
    "#FFEB3C": { id: 672, data: 4 },
    "#FDD734": { id: 673, data: 6 },
    "#FAC02E": { id: 674, data: 8 },
    "#F9A825": { id: 675, data: 10 },
    "#F47F16": { id: 676, data: 12 },
    "#FFD600": { id: 677, data: 14 },
    "#FFEA00": { id: 675, data: 14 },
    "#FFFF00": { id: 680, data: 2 },
    "#FFFF8D": { id: 681, data: 4 },
    "#FFFCDD": { id: 682, data: 6 },
    "#FFECB2": { id: 667, data: 13 },
    "#FFE083": { id: 668, data: 15 },
    "#FFD54F": { id: 670, data: 1 },
    "#FFC928": { id: 671, data: 3 },
    "#FEC107": { id: 672, data: 5 },
    "#FFB200": { id: 673, data: 7 },
    "#FF9F00": { id: 674, data: 9 },
    "#FF8E01": { id: 675, data: 11 },
    "#FF6F00": { id: 676, data: 13 },
    "#FFAB00": { id: 677, data: 15 },
    "#FEC400": { id: 679, data: 1 },
    "#FFD741": { id: 671, data: 0 },
    "#FEE580": { id: 681, data: 5 },
    "#FFF4D6": { id: 682, data: 7 },
    "#FFE0B2": { id: 667, data: 14 },
    "#FFCC80": { id: 1965, data: 0 },
    "#FFB64D": { id: 670, data: 2 },
    "#FFA827": { id: 671, data: 4 },
    "#FF9700": { id: 672, data: 6 },
    "#FB8C00": { id: 673, data: 8 },
    "#F67B01": { id: 674, data: 10 },
    "#EF6C00": { id: 668, data: 0 },
    "#E65100": { id: 676, data: 14 },
    "#FF6D00": { id: 672, data: 15 },
    "#FF9000": { id: 679, data: 2 },
    "#FFAB40": { id: 1961, data: 0 },
    "#FFD181": { id: 681, data: 6 },
    "#FFEFD6": { id: 682, data: 8 },
    "#FFCCBB": { id: 667, data: 15 },
    "#FFAB91": { id: 669, data: 1 },
    "#FF8A66": { id: 670, data: 3 },
    "#FF7143": { id: 671, data: 5 },
    "#FE5722": { id: 672, data: 7 },
    "#F5511E": { id: 673, data: 9 },
    "#E64A19": { id: 674, data: 11 },
    "#D74315": { id: 675, data: 13 },
    "#BF360C": { id: 676, data: 15 },
    "#DD2C00": { id: 678, data: 1 },
    "#FF3D00": { id: 1960, data: 0 },
    "#FF6E41": { id: 680, data: 5 },
    "#FF9E81": { id: 681, data: 7 },
    "#FFE3E0": { id: 682, data: 9 },
    "#D7CCC8": { id: 669, data: 2 },
    "#BCABA4": { id: 670, data: 4 },
    "#A0887E": { id: 671, data: 6 },
    "#8C6E63": { id: 672, data: 8 },
    "#795547": { id: 1969, data: 0 },
    "#6D4D42": { id: 674, data: 12 },
    "#5D4038": { id: 679, data: 0 },
    "#4D342F": { id: 672, data: 9 },
    "#3E2622": { id: 678, data: 2 },
    "#000000": { id: 669, data: 3 },
    "#FFFFFF": { id: 667, data: 0 },
    "#EEEEEE": { id: 670, data: 5 },
    "#E0E0E0": { id: 671, data: 7 },
    "#BDBDBD": { id: 675, data: 0 },
    "#9E9E9E": { id: 673, data: 11 },
    "#757575": { id: 674, data: 13 },
    "#616161": { id: 674, data: 0 },
    "#424242": { id: 677, data: 1 },
    "#212121": { id: 682, data: 0 },
    "#EBEFF2": { id: 679, data: 4 },
    "#CFD8DD": { id: 680, data: 6 },
    "#90A4AD": { id: 681, data: 8 },
    "#78909C": { id: 682, data: 10 },
    "#607D8B": { id: 679, data: 5 },
    "#546F7A": { id: 680, data: 7 },
    "#36474F": { id: 681, data: 9 },
    "#273238": { id: 682, data: 11 }
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
