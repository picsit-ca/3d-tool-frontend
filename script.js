// bien toan cau
const BLOCKS_PER_TOKEN = 1000;
let CURRENT_FILE_DATA = null; 
let CURRENT_COST = 0;      
let USER_BLOCKS = 0;
let USER_TOKENS = 0; 

let isConverting = false;
let abortController = null;

async function updateTokenUI() {
  const el = document.getElementById('tokenUI');

  try {
    const res = await fetch('https://threed-tool-backend.onrender.com/me', {
      credentials: 'include'
    });

    if (!res.ok) {
      window.USER = null;
      USER_TOKENS = 0;

      el.innerHTML = `
        <div style="color:#aaa; font-style:italic">
          Vui lòng đăng nhập để xem Token
        </div>`;
    } else {
      const data = await res.json();

      window.USER = data;
      USER_TOKENS = data.tokens;

      el.innerHTML = `
        <div style="font-weight:bold">
          Tokens: ${USER_TOKENS} 🪙
        </div>`;
    }
  } catch (err) {
    el.innerHTML = `
      <div style="color:red">
        Không kết nối được server
      </div>`;
  }

  updateConvertButton(
    CURRENT_FILE_DATA ? CURRENT_FILE_DATA.blockCount : 0
  );
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

  // LOGIN BACKEND
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
    Block:destroyBlock(e.x, e.y, e.z, false)
    Player:setPosition(e.eventobjid, e.x + X_CENTER, e.y + Y_CENTER, e.z + Z_CENTER)
    Player:setActionAttrState(e.eventobjid, 1, false)

    for _, b in ipairs(blocks) do
        Block:setBlockAll(
        b.x + e.x,
        b.y + e.y,
        b.z + e.z,
        b.id,
        b.data
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
  `{x=${b.x},y=${b.y},z=${b.z},id=${b.id},data=${b.data}}`
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
  if (!window.USER) {
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
    updateConvertButton(CURRENT_FILE_DATA.blockCount);
  }
};

copyBtn.onclick = () => {
  navigator.clipboard.writeText(output.textContent);
  showNotify("Đã copy script vào bộ nhớ tạm!", true);
};