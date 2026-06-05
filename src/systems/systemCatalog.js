import { gameSystems } from '../data/gameSystems/index.js';

const VISIBLE_LINES = 11;

export function createSystemCatalogState() {
  return {
    selectedIndex: 0,
    scrollLine: 0,
  };
}

export function nextSystem(catalogState) {
  catalogState.selectedIndex = (catalogState.selectedIndex + 1) % gameSystems.length;
  catalogState.scrollLine = 0;
  return getSelectedSystem(catalogState);
}

export function previousSystem(catalogState) {
  catalogState.selectedIndex = (catalogState.selectedIndex - 1 + gameSystems.length) % gameSystems.length;
  catalogState.scrollLine = 0;
  return getSelectedSystem(catalogState);
}

export function getSelectedSystem(catalogState) {
  return gameSystems[catalogState.selectedIndex];
}

export function getSystemCatalogLines(catalogState) {
  return getSystemCatalogView(catalogState).lines;
}

export function getSystemCatalogView(catalogState) {
  const system = getSelectedSystem(catalogState);
  const lines = [
    `${catalogState.selectedIndex + 1}/${gameSystems.length} - ${system.name}`,
    '',
    getSystemSummary(system),
    '',
    ...formatSystemValue(system),
  ];

  const maxScroll = Math.max(0, lines.length - VISIBLE_LINES);
  catalogState.scrollLine = PhaserMathClamp(catalogState.scrollLine, 0, maxScroll);

  return {
    lines: lines.slice(catalogState.scrollLine, catalogState.scrollLine + VISIBLE_LINES),
    scrollLine: catalogState.scrollLine,
    maxScroll,
    visibleLines: VISIBLE_LINES,
    totalLines: lines.length,
  };
}

export function scrollSystemCatalog(catalogState, deltaLines) {
  const view = getSystemCatalogView(catalogState);
  catalogState.scrollLine = PhaserMathClamp(catalogState.scrollLine + deltaLines, 0, view.maxScroll);
  return getSystemCatalogView(catalogState);
}

function getSystemSummary(system) {
  const summaries = {
    character: 'Dung de tao nhan vat rieng cua nguoi choi, theo doi cap do nghe nghiep va mo khoa ky nang theo cach choi.',
    farm: 'Quan ly toan bo nong trai: don dep mat bang, trong cay, nang cap dat va lap cac cong trinh ho tro san xuat.',
    crops: 'Quy dinh cay trong theo mua. Moi mua co nhom cay rieng, giup gameplay thay doi theo lich nam.',
    animals: 'Cho phep nuoi dong vat, cham soc hang ngay va thu san pham de ban, nau an hoac che tao.',
    mounts: 'Mo khoa thu cuoi giup di chuyen nhanh hon va tao cam giac tien trien trong hanh trinh.',
    fishing: 'Them hoat dong cau ca, mini game giu thang bang va ho ca de nuoi/sinh san ca.',
    mining: 'Mo Ancient Mine 100 tang voi quang, da quy va vat lieu hiem phuc vu nang cap.',
    combat: 'He thong chien dau cho mo, dungeon va boss, gom vu khi, quai vat va ky nang tan cong.',
    bosses: 'Cac tran dau lon gan voi cot truyen chinh, bi mat va noi dung endgame.',
    npcs: 'Quan ly dan lang voi lich trinh, nha rieng, cong viec va so thich qua tang.',
    friendship: 'Do do than thiet tu 0 den 10 tim thong qua noi chuyen, tang qua va lam nhiem vu.',
    romance: 'Mo tu tuyen tinh yeu: to tinh, hen ho, cau hon va ket hon.',
    children: 'Noi dung gia dinh sau ket hon, gom co con, nuoi con va con truong thanh.',
    quests: 'Khung nhiem vu chinh, phu va an de dan nguoi choi qua cot truyen Green Hollow.',
    grandfatherJournal: '48 trang nhat ky dung de mo lore, lich su thi tran va bi mat World Tree.',
    festivals: 'Su kien theo mua voi mini game rieng de thi tran co nhip song va phan thuong dac biet.',
    weather: 'Thoi tiet anh huong ngay choi, cay trong, su kien hiem va tai nguyen xuat hien.',
    seasons: 'Chu ky mua trong nam, gom bon mua chinh va Celestial Season sau endgame.',
    crafting: 'Cho phep tao do dung, may moc va nau an tu tai nguyen thu thap duoc.',
    house: 'Nang cap nha, trang tri va them noi that de ca nhan hoa nong trai.',
    museum: 'Noi hien tang ca, da quy, khoang san va co vat de dat muc tieu 100%.',
    pets: 'Thu cung di theo nguoi choi, gom thu thuong va pet huyen thoai.',
    areas: 'Mo rong ban do tu khu co ban den dia diem nang cao va khu endgame.',
    economy: 'He thong tien te va ban vat pham, giup nguoi choi dau tu nguoc lai vao nong trai.',
    achievements: 'Thanh tuu dai han ghi nhan thanh tich lon cua nguoi choi.',
    endgame: 'Noi dung sau pha dao: tower, boss, pet/vu khi huyen thoai va nhieu ending.',
  };
  return summaries[system.id] ?? 'He thong nay se duoc mo rong thanh mot module gameplay rieng.';
}

function formatSystemValue(value, depth = 0) {
  if (Array.isArray(value)) return value.map((item) => `${indent(depth)}- ${item}`);

  if (value && typeof value === 'object') {
    return Object.entries(value)
      .filter(([key]) => key !== 'id' && key !== 'name')
      .flatMap(([key, nestedValue]) => {
        const label = titleCase(key);
        if (Array.isArray(nestedValue)) {
          return [`${indent(depth)}${label}:`, ...nestedValue.map((item) => `${indent(depth + 1)}- ${formatPrimitive(item)}`)];
        }
        if (nestedValue && typeof nestedValue === 'object') {
          return [`${indent(depth)}${label}:`, ...formatSystemValue(nestedValue, depth + 1)];
        }
        return [`${indent(depth)}${label}: ${formatPrimitive(nestedValue)}`];
      });
  }

  return [`${indent(depth)}${formatPrimitive(value)}`];
}

function formatPrimitive(value) {
  if (typeof value === 'string' || typeof value === 'number') return value;
  return JSON.stringify(value);
}

function titleCase(value) {
  return value
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (first) => first.toUpperCase());
}

function indent(depth) {
  return '  '.repeat(depth);
}

function PhaserMathClamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
