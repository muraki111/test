// 2000年代オタク風 好きな曲リスト main.js
function getYouTubeId(url) {
  // v=ID 形式 or youtu.be/ID 形式両対応
  let match = url.match(/[?&]v=([\w-]+)/);
  if (match) return match[1];
  match = url.match(/youtu\.be\/([\w-]+)/);
  if (match) return match[1];
  return '';
}
function getYouTubeThumbnail(url) {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : '';
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].replace(/\r/g, '').split(',');
  return lines.slice(1).map(line => {
    const cols = line.replace(/\r/g, '').split(',');
    const obj = {};
    headers.forEach((h, i) => obj[h] = cols[i] || '');
    return obj;
  });
}

// 変更前CSV（タイトル,アーティスト,カテゴリ,YouTube）にも対応できるように、
// カラム名がなければ従来のカラム名で処理するようにする
function getSongField(song, key) {
  // 新CSV
  if (key === 'リンク' && song['リンク']) return song['リンク'];
  if (key === '作品名' && song['作品名']) return song['作品名'];
  if (key === 'ジャンル' && song['ジャンル']) return song['ジャンル'];
  // 旧CSV
  if (key === 'リンク' && song['YouTube']) return song['YouTube'];
  if (key === '作品名' && song['カテゴリ']) return song['カテゴリ'];
  if (key === 'ジャンル' && song['カテゴリ']) return song['カテゴリ'];
  return song[key] || '';
}

function getUniqueValues(songs, key) {
  return [...new Set(songs.map(song => song[key]).filter(Boolean))];
}

function getUniqueValuesMulti(songs, key) {
  const set = new Set();
  songs.forEach(song => {
    if (song[key]) {
      song[key].split('、').forEach(val => {
        const trimmed = val.trim();
        if (trimmed) set.add(trimmed);
      });
    }
  });
  return [...set];
}

function createCheckboxFilter(id, label, values) {
  const container = document.createElement('div');
  container.className = 'checkbox-filter';
  const title = document.createElement('div');
  title.className = 'checkbox-title';
  title.textContent = label;
  container.appendChild(title);
  values.forEach(val => {
    const labelEl = document.createElement('label');
    labelEl.className = 'checkbox-label';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = val;
    input.name = id;
    labelEl.appendChild(input);
    labelEl.appendChild(document.createTextNode(truncateText(val, 14)));
    container.appendChild(labelEl);
  });
  return container;
}

function getCheckedValues(name) {
  return Array.from(document.querySelectorAll(`input[name='${name}']:checked`)).map(cb => cb.value);
}

function renderFilterUI(songs) {
  const filterDiv = document.querySelector('.filter');
  filterDiv.innerHTML = '';
  const artistValues = getUniqueValuesMulti(songs, 'アーティスト');
  const workValues = getUniqueValuesMulti(songs, '作品名');
  const genreValues = getUniqueValuesMulti(songs, 'ジャンル');
  filterDiv.appendChild(createCheckboxFilter('artist', 'アーティスト', artistValues));
  filterDiv.appendChild(createCheckboxFilter('work', '作品名', workValues));
  filterDiv.appendChild(createCheckboxFilter('genre', 'ジャンル', genreValues));
}

function renderCards(songs) {
  const tbody = document.querySelector('#songsTable tbody');
  tbody.innerHTML = '';
  // メッセージ用要素があれば削除
  const oldMsg = document.getElementById('no-result-message-outer');
  if (oldMsg) oldMsg.remove();
  if (songs.length === 0) {
    // テーブル外にメッセージを表示
    const container = document.querySelector('.container');
    const msgDiv = document.createElement('div');
    msgDiv.id = 'no-result-message-outer';
    msgDiv.className = 'no-result-message-outer';
    msgDiv.innerHTML = '<div class="no-result-message-inner">該当する曲がありません。<br>フィルター条件を変更してください。</div>';
    container.appendChild(msgDiv);
    return;
  } else {
    // 曲がある場合はメッセージを消す
    const oldMsg = document.getElementById('no-result-message-outer');
    if (oldMsg) oldMsg.remove();
  }
  let tr = document.createElement('tr');
  let rowTds = [];
  songs.forEach((song, i) => {
    const td = document.createElement('td');
    td.style.width = '25%';
    td.style.verticalAlign = 'top';
    // 旧CSV対応
    let link = song['リンク'] || '';
    // YouTubeリンクが "https://" で始まらない場合は補完
    if (link && !/^https?:\/\//.test(link)) {
      link = 'https://' + link;
    }
    const work = song['作品名'] || '';
    const genre = song['ジャンル'] || '';
    const thumbUrl = getYouTubeThumbnail(link);
    let thumbHtml = '';
    if (link && thumbUrl) {
      thumbHtml = `<a href="${link}" target="_blank"><img class="youtube-thumb" src="${thumbUrl}" alt="YouTubeサムネ" onerror=\"this.onerror=null;this.parentNode.innerHTML='<a href='${link}' target='_blank'><div class=\\'youtube-thumb no-thumb\\'>No Image</div></a>'\"></a>`;
    } else if (link) {
      thumbHtml = `<a href="${link}" target="_blank" style="text-decoration:none;"><div class='youtube-thumb no-thumb'>No Image</div></a>`;
    } else {
      thumbHtml = `<div class='youtube-thumb no-thumb'>No Image</div>`;
    }
    td.innerHTML = `
      <div class="song-card">
        ${thumbHtml}
        <div class="song-title">${truncateText(song['タイトル'] || '', 18)}</div>
        <div class="song-artist">${truncateText(song['アーティスト'] || '', 14)}</div>
        <div class="song-category">${truncateText(work, 14)}</div>
        <div class="song-category">${truncateText(genre, 10)}</div>
      </div>
    `;
    rowTds.push(td);
    if ((i + 1) % 4 === 0) {
      // 高さを揃える
      let maxHeight = 0;
      rowTds.forEach(cell => {
        const card = cell.querySelector('.song-card');
        if (card.offsetHeight > maxHeight) maxHeight = card.offsetHeight;
      });
      rowTds.forEach(cell => {
        cell.querySelector('.song-card').style.height = maxHeight + 'px';
      });
      rowTds.forEach(cell => tr.appendChild(cell));
      tbody.appendChild(tr);
      tr = document.createElement('tr');
      rowTds = [];
    }
  });
  if (rowTds.length > 0) {
    // 最終行の高さを揃える
    let maxHeight = 0;
    rowTds.forEach(cell => {
      const card = cell.querySelector('.song-card');
      if (card.offsetHeight > maxHeight) maxHeight = card.offsetHeight;
    });
    rowTds.forEach(cell => {
      cell.querySelector('.song-card').style.height = maxHeight + 'px';
    });
    rowTds.forEach(cell => tr.appendChild(cell));
    tbody.appendChild(tr);
  }
}

function filterSongs(songs) {
  const checkedArtists = getCheckedValues('artist');
  const checkedWorks = getCheckedValues('work');
  const checkedGenres = getCheckedValues('genre');
  return songs.filter(song => {
    // アーティスト
    const songArtists = song['アーティスト'] ? song['アーティスト'].split('、').map(s => s.trim()) : [];
    const songWorks = song['作品名'] ? song['作品名'].split('、').map(s => s.trim()) : [];
    const songGenres = song['ジャンル'] ? song['ジャンル'].split('、').map(s => s.trim()) : [];
    const artistMatch = checkedArtists.length === 0 || songArtists.some(a => checkedArtists.includes(a));
    const workMatch = checkedWorks.length === 0 || songWorks.some(w => checkedWorks.includes(w));
    const genreMatch = checkedGenres.length === 0 || songGenres.some(g => checkedGenres.includes(g));
    return artistMatch && workMatch && genreMatch;
  });
}

function truncateText(text, maxLength) {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

fetch('songs.csv')
  .then(res => res.text())
  .then(text => {
    const songs = parseCSV(text);
    renderFilterUI(songs);
    renderCards(songs);
    document.querySelectorAll('.checkbox-filter input[type=checkbox]').forEach(cb => {
      cb.addEventListener('change', () => {
        renderCards(filterSongs(songs));
      });
    });
  });
