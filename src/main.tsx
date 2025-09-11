import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// 아래 파일 경로는 형의 실제 파일 위치에 따라 다를 수 있습니다.
import { ensureAnonSession } from './lib/auth/anon.ts' 

// 1. main이라는 이름의 async 함수(비동기 작업 상자)를 만듭니다.
async function main() {
  // 2. 문제가 됐던 await 코드를 이 상자 안으로 옮깁니다.
  await ensureAnonSession();

  // 3. 나머지 앱 실행 코드도 이 안에 그대로 둡니다.
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

// 4. 마지막으로 main 함수를 호출해서 모든 것을 시작합니다.
main();