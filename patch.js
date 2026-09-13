const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const target = `const blob = new Blob([html], { type: 'text/html' }); 
        const url = URL.createObjectURL(blob); 
        const a = document.createElement('a'); 
        a.href = url; 
        a.download = \`Fashion_Rewinder_Exhibition_FULL.html\`; 
        a.click();
        showMessage("✅ 내보내기 완료!");`;

const replacement = `const blob = new Blob([html], { type: 'text/html' }); 
        const url = URL.createObjectURL(blob); 
        const a = document.createElement('a'); 
        a.href = url; 
        a.download = \`Fashion_Rewinder_Exhibition_FULL.html\`; 
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // 브라우저에서 비동기 다운로드를 차단할 경우를 대비해 수동 다운로드 버튼도 표시
        const msgBox = document.getElementById('message-box');
        msgBox.innerHTML = \`✅ 내보내기 준비 완료! 다운로드가 시작되지 않으면 <a href="\${url}" download="Fashion_Rewinder_Exhibition_FULL.html" style="color: #60a5fa; text-decoration: underline; font-weight: bold; cursor: pointer;">여기를 클릭</a>하세요.\`;
        msgBox.style.display = 'block';
        setTimeout(() => { msgBox.style.display = 'none'; msgBox.innerText = ''; }, 10000);`;

html = html.replace(target, replacement);
fs.writeFileSync('index.html', html);
