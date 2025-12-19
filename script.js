// bien toan cau
const BLOCKS_PER_TOKEN = 1000;
let CURRENT_FILE_DATA = null; 
let CURRENT_COST = 0;         

function updateTokenUI(){
  if(!window.USER) return;
  const tokens = getTokens();
  const ui = document.getElementById("tokenUI");
  
  ui.innerHTML = `
    <div class="token-badge">
      <span class="token-icon">🪙</span>
      <span class="token-value">${tokens}</span>
      <div class="token-sub">
        <b>Token khả dụng</b><br>
        1 token = ${BLOCKS_PER_TOKEN} blocks
      </div>
    </div>
  `;
}

// dang nhap google
function parseJwt(token){
  return JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
}

function onGoogleLogin(res){
  const p = parseJwt(res.credential);
  window.USER = { id:p.sub, email:p.email, name:p.name };

  document.getElementById("loginStatus").textContent = "Xin chào, " + p.name;
  
  // an nut dang nhap cho gon
  document.querySelector(".g_id_signin").style.display = "none";

  // neu chon file trc khi dang nhan thi dat lai nut
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
convertBtn.onclick = () => {
  if(!window.USER || !CURRENT_FILE_DATA) return;

  try {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    const blocks = CURRENT_FILE_DATA.map(v => {
      const hex = "#" + [v.red,v.green,v.blue]
        .map(x => (+x).toString(16).padStart(2,"0").toUpperCase()).join("");
      const bc = BlockColor[hex] || nearestColor(v.red,v.green,v.blue);
      
      const blockX = -v.x;
      const blockY = v.y;
      const blockZ = v.z;

      //min/max
      minX = Math.min(minX, blockX);
      maxX = Math.max(maxX, blockX);
      minY = Math.min(minY, blockY);
      maxY = Math.max(maxY, blockY);
      minZ = Math.min(minZ, blockZ);
      maxZ = Math.max(maxZ, blockZ);

      return {x: blockX, y: blockY, z: blockZ, id: bc.id, data: bc.data};
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
${blocks.map(b=>`{x=${b.x},y=${b.y},z=${b.z},id=${b.id},data=${b.data}}`).join(",\n")}
}`;

    output.textContent = lua;
    copyBtn.disabled = false;
    showNotify("✅ Chuyển đổi thành công! Đã trừ " + CURRENT_COST + " token.", true);
    
  } catch(err){
    showNotify("Lỗi convert: " + err, false);
  }
};

copyBtn.onclick = () => {
  navigator.clipboard.writeText(output.textContent);
  showNotify("Đã copy script vào bộ nhớ tạm!", true);
};