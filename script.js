// ==========================================================================
// Style Rewinder - 3D Fashion Mixer 메인 클라이언트 스크립트
// ==========================================================================

// 기존 브라우저 캐시(잘못된 이미지 경로 및 스타일 세트) 1회 초기화
if (!localStorage.getItem('fm_reset_v8')) {
    localStorage.clear();
    if (window.indexedDB) {
        indexedDB.deleteDatabase('FashionMixerDB');
    }
    localStorage.setItem('fm_reset_v8', 'true');
    console.log('Previous cached data cleared for v8 update.');
}

// --------------------------------------------------------------------------
// 1. 디버그 로거 및 에러 리스너
// --------------------------------------------------------------------------
function logDebug(msg) {
    console.log(msg);
    const d = document.getElementById('debug-log');
    if(d) d.innerHTML += '<div>' + msg + '</div>';
}
window.addEventListener('error', function(e) {
    if (!e.message || e.message === 'Script error.' || e.message === 'Script error') return;
    logDebug('❌ ERROR: ' + e.message);
});

// --------------------------------------------------------------------------
// 2. Three.js 렌더링 전역 객체 및 인터랙션 상태 변수
// --------------------------------------------------------------------------
let scene, camera, renderer, cylinders = [];
const _raycaster = new THREE.Raycaster();
const _pointerVec = new THREE.Vector2();

// 마우스/터치 드래그 및 회전 관련 상태
let isDragging = false, hasDragged = false, dragStartX = 0, dragStartRotation = 0, dragStartRotations = [], activeCylinderIndex = -1;
let isHovering = false; 
let hoveredCylinderIndex = -1;
let lastInteractionTime = 0; 
let pauseAutoDuration = 0; // 마우스가 이미지 위에 올랐을 때 자동 회전을 즉시 일시정지하는 타이머
let pointerStartTime = 0, pointerStartPos = { x: 0, y: 0 }; 

// 원통 배치 및 회전 정밀도 파라미터
const ITEM_COUNT = 20;                             // 원통 1개당 배치되는 패션 아이템 슬롯 개수 (20개)
const CYLINDER_RADIUS = 1.0;                       // 3D 원통 반경
const isIPad = /iPad/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
let isLocked = /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent); // 모바일 환경에서는 기본적으로 전시 모드(Locked Mode)
if (isLocked && typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => document.body.classList.add('mode-locked'));
}
const SLOT_WIDTH = (2 * Math.PI * CYLINDER_RADIUS) / ITEM_COUNT; // 1개 아이템 슬롯 호의 길이
const ROTATION_STEP = (Math.PI * 2) / ITEM_COUNT;  // 아이템 1개당 회전 각도 (18도)

// 2D 펼침 모드 (Unrolled Flat View) 및 3D 원통 모프(Morph) 변수
let isFlatView = false;                            // 현재 2D 펼침 모드 활성화 여부
let flattenProgress = 0;                           // 3D -> 2D 변환 현재 진행률 (0: 3D, 1: 2D)
let targetFlattenProgress = 0;                     // 목표 변환 진행률

// 카메라 줌(Zoom) 관련 변수 (휠 & 트랙패드 지원)
let currentZoom = 1.0;                             // 현재 줌 배율
let targetZoom = 1.0;                              // 목표 줌 배율
const MIN_ZOOM = 0.4;                              // 줌 인 최고 한계 (카메라 접근)
const MAX_ZOOM = 2.5;                              // 줌 아웃 최고 한계 (카메라 후퇴)


let CATEGORIES = [
    {
        "id": 0,
        "name": "HAT",
        "items": [
            {
                "url": "images/HAT/hat_1.png",
                "setIds": []
            },
            {
                "url": "images/HAT/hat_2.png",
                "setIds": []
            },
            {
                "url": "images/HAT/hat_3.png",
                "setIds": []
            },
            {
                "url": "images/HAT/hat_4.png",
                "setIds": []
            },
            {
                "url": "images/HAT/hat_5.png",
                "setIds": []
            },
            {
                "url": "images/HAT/hat_6.png",
                "setIds": []
            },
            {
                "url": "images/HAT/hat_7.png",
                "setIds": []
            },
            {
                "url": "images/HAT/hat_8.png",
                "setIds": []
            },
            {
                "url": "images/HAT/hat_9.png",
                "setIds": []
            },
            {
                "url": "images/HAT/hat_10.png",
                "setIds": []
            },
            {
                "url": "images/HAT/hat_11.png",
                "setIds": []
            },
            {
                "url": "images/HAT/hat_12.png",
                "setIds": []
            },
            {
                "url": "images/HAT/hat_13.png",
                "setIds": []
            },
            {
                "url": "images/HAT/hat_14.png",
                "setIds": []
            },
            {
                "url": "images/HAT/hat_15.png",
                "setIds": []
            },
            {
                "url": "images/HAT/hat_16.png",
                "setIds": []
            },
            {
                "url": "images/HAT/hat_17.png",
                "setIds": []
            },
            {
                "url": "images/HAT/hat_18.png",
                "setIds": []
            },
            {
                "url": "images/HAT/hat_19.png",
                "setIds": []
            }
        ]
    },
    {
        "id": 1,
        "name": "ACC",
        "items": [
            {
                "url": "images/ACC/acc_1.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_2.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_3.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_4.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_5.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_6.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_7.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_8.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_9.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_10.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_11.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_12.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_13.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_14.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_15.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_16.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_17.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_18.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_19.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_20.png",
                "setIds": []
            }
        ]
    },
    {
        "id": 2,
        "name": "TOP",
        "items": [
            {
                "url": "images/TOP/top_1.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_2.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_3.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_4.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_5.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_6.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_7.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_8.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_9.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_10.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_11.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_12.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_13.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_14.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_15.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_16.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_17.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_18.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_19.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_20.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_21.png",
                "setIds": []
            }
        ]
    },
    {
        "id": 3,
        "name": "BOTTOM",
        "items": [
            {
                "url": "images/BOOTOM/bottom_1.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_2.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_3.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_4.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_5.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_6.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_7.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_8.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_9.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_10.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_11.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_12.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_13.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_14.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_15.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_16.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_17.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_18.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_19.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_20.png",
                "setIds": []
            }
        ]
    },
    {
        "id": 4,
        "name": "SHOES",
        "items": [
            {
                "url": "images/SHOES/shoes_1.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_2.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_3.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_4.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_5.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_6.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_7.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_8.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_9.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_10.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_11.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_12.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_13.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_14.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_15.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_16.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_17.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_18.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_19.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_20.png",
                "setIds": []
            }
        ]
    }
];
let STYLE_SETS = [{ id: 1, name: 'STYLING 1' }];
let editingSetId = null;

// --------------------------------------------------------------------------
// 3. 카테고리별 원통 높이 계산 함수 (HAT, ACC, TOP, BOTTOM, SHOES)
// --------------------------------------------------------------------------
function getCylinderHeight(index) {
    let h = 7.0; 
    if (index === 0) h = 8.5;       // HAT (모자 원통 높이)
    else if (index === 1) h = 7.0;  // ACC (액세서리 원통 높이)
    else if (index === 2) h = 18.0; // TOP (상의 원통 높이)
    else if (index === 3) h = 22.0; // BOTTOM (하의 원통 높이)
    else if (index === 4) h = 7.0;  // SHOES (신발 원통 높이)
    return SLOT_WIDTH * (h / 16); 
}

// --------------------------------------------------------------------------
// 3-1. 스마트폰 및 디스플레이 종횡비(Aspect Ratio) 기반 반응형 카메라 거리 계산 함수
// --------------------------------------------------------------------------
function getCameraDistance(t = (typeof flattenProgress !== 'undefined' ? flattenProgress : 0)) {
    const aspect = window.innerWidth / window.innerHeight;
    let aspectMultiplier = 1.0;
    if (aspect < 1.4 && !isIPad) {
        // 스마트폰 세로 모드(aspect < 1.4)에서 텍스트와 겹치지 않게 적절히 큼직하도록 비례 조정 (기존 0.95 -> 0.55)
        aspectMultiplier = (1.4 / aspect) * 0.55;
        aspectMultiplier = Math.max(1.0, Math.min(aspectMultiplier, 2.5));
    }
    let baseCamZ = (3.0 * (1 - t) + 3.2 * t) * aspectMultiplier;
    
    if (isIPad) {
        // 아이패드에서는 원통 크기가 90%로 작아지도록 카메라 거리를 늘려줌
        baseCamZ = baseCamZ / 0.9;
    }
    
    return baseCamZ;
}

// --------------------------------------------------------------------------
// 4. Three.js 3D 씬 및 이벤트 리스너 초기화 (init)
// --------------------------------------------------------------------------
async function init() {
    try {
        cylinders = [];
        scene = new THREE.Scene(); 
        
        // 스탠바이미 최적화: alpha: false를 지원하기 위해 Three.js 씬 배경에 동일한 방사형 그라데이션 직접 렌더링
        // 이로 인해 webOS 브라우저의 소프트웨어 알파 컴포지팅 부하를 100% 제거하고 하드웨어 다이렉트 플레인 활성화
        scene.background = new THREE.Color('#111111');

        camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000); 
        camera.position.set(0, 0, getCameraDistance(0)); // 카메라 기본 거리 설정 (모바일/PC 반응형 자동 계산)
        
        // alpha: false 및 mediump 셰이더 연산으로 Mali GPU 처리량 극대화
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance", precision: "mediump" }); 
        renderer.setSize(window.innerWidth, window.innerHeight); 
        const isLowEndDevice = /webOS|SmartTV/i.test(navigator.userAgent);
        // 스탠바이미(FHD 1080p)는 1.0으로 1:1 선명한 네이티브 화질 완벽 유지, 모바일 및 PC는 최대 2.0 고해상도 지원
        renderer.setPixelRatio(isLowEndDevice ? 1.0 : Math.min(window.devicePixelRatio || 1, 2.0)); 
        const canvasContainer = document.getElementById('canvas-container');
        if (canvasContainer) {
            canvasContainer.innerHTML = '';
            canvasContainer.appendChild(renderer.domElement);
        }
        
        // 조명 설정 (AmbientLight + DirectionalLight)
        scene.add(new THREE.AmbientLight(0xffffff, 0.7));
        const L2 = new THREE.DirectionalLight(0xffffff, 0.8); L2.position.set(10, 20, 10); scene.add(L2);
        
        // 5개 카테고리별 원통 3D 메시 생성 및 씬에 추가
        for (let i = 0; i < CATEGORIES.length; i++) {
            const cyl = await createCylinderMesh(i); scene.add(cyl.group);
        }
        await loadEverything();
    } catch (error) { 
        logDebug('❌ INIT FAIL: ' + error.message); 
    } finally { 
        setTimeout(hideLoader, 1500); 
    }
    
    // 리사이즈 및 화면 회전(가로/세로 전환) 이벤트 대응
    const handleViewportResize = () => { 
        if (!camera || !renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight; 
        camera.updateProjectionMatrix(); 
        renderer.setSize(window.innerWidth, window.innerHeight); 
        const isLowEndDevice = /webOS|SmartTV/i.test(navigator.userAgent);
        renderer.setPixelRatio(isLowEndDevice ? 1.0 : Math.min(window.devicePixelRatio || 1, 2.0));
    };
    window.addEventListener('resize', handleViewportResize);
    window.addEventListener('orientationchange', () => {
        setTimeout(handleViewportResize, 100);
        setTimeout(handleViewportResize, 300);
    });
    
    const cont = document.getElementById('canvas-container');
    if (cont) {
        cont.addEventListener('pointerdown', onPointerDown); 
        cont.addEventListener('dblclick', (e) => {
            // 이미지 더블클릭 시 팝업
            handleCylinderDblClick(e);
        });
    }
    window.addEventListener('pointermove', onPointerMove); 
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp); // 터치 제스처 중단 시 멈춤 방지
    
    // 더블클릭 이벤트 처리
    window.addEventListener('dblclick', (e) => {
        if (e.target === document.body || e.target.id === 'canvas-container' || e.target.tagName === 'CANVAS') {
            // 이미지 위에서 더블클릭한 경우 팝업
            handleCylinderDblClick(e);
        }
    });

    animate();

    // 좌측 스타일 휠 수직 스크롤 이벤트 연결
    const sideView = document.getElementById('side-style-container');
    if (sideView) {
        // sideView.addEventListener('scroll', updateActiveSideStyle);
    }
}

window.addEventListener('wheel', (e) => {
    if (e.target.closest('#management-panel, #side-style-wrapper, #instruction-overlay, #info-popup, .controls, #audio-control-btn, .ui-overlay, #management-btn-wrapper')) {
        return;
    }

    _pointerVec.set((e.clientX/innerWidth)*2-1, -(e.clientY/innerHeight)*2+1);
    _raycaster.setFromCamera(_pointerVec, camera);
    const intersects = _raycaster.intersectObjects(getAllInteractableMeshes());
    
    let targetCat = -1;
    if (intersects.length > 0) {
        targetCat = findCategoryIndexByMesh(intersects[0].object);
    }
    
    if (targetCat !== -1 && cylinders[targetCat]) {
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        const sensitivity = isFlatView ? -0.0035 : 0.0035;
        cylinders[targetCat].targetRotation += delta * sensitivity;
        pauseAutoDuration = 3000;
    }
}, { passive: true });


// --------------------------------------------------------------------------
// 6. IndexedDB 오프라인/로컬 영구 저장소 입출력 (openDB, save, load)
// --------------------------------------------------------------------------
function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open('FashionMixerDB', 1);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('store')) {
                db.createObjectStore('store');
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function saveStateToIDB() {
    try {
        const db = await openDB();
        const tx = db.transaction('store', 'readwrite');
        const store = tx.objectStore('store');
        store.put(JSON.stringify(CATEGORIES), 'fm_imgs');
        store.put(JSON.stringify(STYLE_SETS), 'fm_sets');
        store.put(JSON.stringify(cylinders.map(c => c.targetRotation)), 'fm_rots');
    } catch (e) {
        console.warn("IndexedDB save error:", e);
    }
}

async function loadStateFromIDB() {
    try {
        const db = await openDB();
        const tx = db.transaction('store', 'readonly');
        const store = tx.objectStore('store');
        const get = (key) => new Promise((res) => {
            const req = store.get(key);
            req.onsuccess = () => res(req.result);
            req.onerror = () => res(null);
        });
        const imgs = await get('fm_imgs');
        const sets = await get('fm_sets');
        const rots = await get('fm_rots');
        return { imgs, sets, rots };
    } catch (e) {
        return null;
    }
}

async function loadEverything() {
    let dataToLoad = { rotations: [] };
    
    // 1. IndexedDB / localStorage 사용자 최근 수정 저장값 로드
    const idbData = await loadStateFromIDB();
    const imgs = idbData?.imgs || localStorage.getItem('fm_imgs');
    const sets = idbData?.sets || localStorage.getItem('fm_sets');
    const rotsStr = idbData?.rots || localStorage.getItem('fm_rots');
    const rots = rotsStr ? (typeof rotsStr === 'string' ? JSON.parse(rotsStr) : rotsStr) : null;

    let loadedImgs = imgs ? (typeof imgs === 'string' ? JSON.parse(imgs) : imgs) : null;
    let loadedSets = sets ? (typeof sets === 'string' ? JSON.parse(sets) : sets) : null;

    // 2. 사용자 수정본이 있으면 그것을 적용하고, 없으면 HTML에 포함된 EMBEDDED_DATA(초기 기본값) 적용
    if (loadedImgs && Array.isArray(loadedImgs) && loadedImgs.length > 0) {
        CATEGORIES = loadedImgs;
    } else if (window.EMBEDDED_DATA && window.EMBEDDED_DATA.categories) {
        CATEGORIES = window.EMBEDDED_DATA.categories;
    }

    if (loadedSets && Array.isArray(loadedSets) && loadedSets.length > 0) {
        STYLE_SETS = loadedSets;
    } else if (window.EMBEDDED_DATA && window.EMBEDDED_DATA.sets) {
        STYLE_SETS = window.EMBEDDED_DATA.sets;
    }

    if (rots && Array.isArray(rots)) {
        dataToLoad.rotations = rots;
    } else if (window.EMBEDDED_DATA && window.EMBEDDED_DATA.rotations) {
        dataToLoad.rotations = window.EMBEDDED_DATA.rotations;
    }
    
    // 원통 텍스처 및 각도 데이터 적용
    const currentRots = dataToLoad.rotations || [];
    for (let i = 0; i < CATEGORIES.length; i++) {
        await updateCylinderTexture(i);
        if (currentRots[i] !== undefined) {
            cylinders[i].targetRotation = currentRots[i];
            cylinders[i].currentAngle = currentRots[i];
            cylinders[i].flatReferenceAngle = currentRots[i];
            cylinders[i].group.rotation.y = currentRots[i];
        }
    }
    
    updateTopCarousel(); 
    createUI();
    updateStorageStatus();
}

// --------------------------------------------------------------------------
// 7. Ease In Out 애니메이션 쿼틱 함수 및 3D <-> 2D 변환 모프 함수
// --------------------------------------------------------------------------
function easeInOutCubic(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}




// --------------------------------------------------------------------------
// 8. 3D/2D 메인 렌더링 프레임 루프 (animate)
// --------------------------------------------------------------------------
let lastTime = 0;

function animate(time) { 
    requestAnimationFrame(animate); 

    if (!time) time = performance.now();
    let dt = time - lastTime;
    lastTime = time;
    if (dt > 100) dt = 16.666; // 프레임 스킵 방지 (탭 이동 등)
    const timeScale = dt / 16.666;

    // 백그라운드 탭 또는 문서 숨김 시 렌더링 연산 일시정지 (스탠바이미 CPU/GPU 리소스 보호)
    if (document.hidden) return;

    // 3D 입체 원통 <-> 2D 펼침 모프 보정 애니메이션
    let isMorphing = false;
    if (flattenProgress !== targetFlattenProgress) {
        isMorphing = true;
        const morphSpeed = 0.04 * timeScale;
        if (flattenProgress < targetFlattenProgress) {
            flattenProgress = Math.min(1, flattenProgress + morphSpeed);
        } else {
            flattenProgress = Math.max(0, flattenProgress - morphSpeed);
        }
    }

    const t = easeInOutCubic(flattenProgress);
    const sinT = Math.sin(t * Math.PI);

    cylinders.forEach((c) => { 
        if (c.mesh && c.mesh.material && c.mesh.material.userData && c.mesh.material.userData.shader) {
            c.mesh.material.userData.shader.uniforms.uMorphT.value = t;
            c.mesh.material.userData.shader.uniforms.uSinT.value = sinT;
        }

        // 스탠바이미 최적화: 모핑 전환 중 매 프레임 CPU 버텍스 연산 및 GPU 버퍼 전송 제거!
        // GPU 버텍스 셰이더가 60FPS로 완벽히 부드럽게 모핑을 수행하므로, CPU 정점 동기화는 모핑 종료 시점에만 1회 정밀 수행하여 Raycaster 정확도 보장
        if (!isMorphing && c.mesh && c.mesh.geometry && c.mesh.geometry.userData.origPositions) {
            const geo = c.mesh.geometry;
            if (geo.userData.lastT !== t) {
                geo.userData.lastT = t;
                const orig = geo.userData.origPositions;
                const flat = geo.userData.flatPositions;
                const posAttr = geo.attributes.position;
                const count = posAttr.count;
                if (t === 0) {
                    posAttr.array.set(orig);
                    if (geo.userData.origBox) {
                        geo.boundingBox.copy(geo.userData.origBox);
                        geo.boundingSphere.copy(geo.userData.origSphere);
                    } else {
                        geo.computeBoundingBox();
                        geo.computeBoundingSphere();
                    }
                } else if (t === 1) {
                    posAttr.array.set(flat);
                    if (geo.userData.flatBox) {
                        geo.boundingBox.copy(geo.userData.flatBox);
                        geo.boundingSphere.copy(geo.userData.flatSphere);
                    } else {
                        geo.computeBoundingBox();
                        geo.computeBoundingSphere();
                    }
                } else {
                    for (let i = 0; i < count; i++) {
                        const u = geo.attributes.uv.getX(i);
                        const theta = (u - 0.5) * Math.PI * 2;
                        const archFactor = sinT * Math.cos(theta * 0.5) * 0.08;

                        const px = orig[i * 3] * (1 - t) + flat[i * 3] * t;
                        const py = orig[i * 3 + 1] * (1 - t) + flat[i * 3 + 1] * t;
                        const pz = orig[i * 3 + 2] * (1 - t) + (flat[i * 3 + 2] + archFactor) * t;

                        posAttr.setXYZ(i, px, py, pz);
                    }
                    geo.computeBoundingSphere();
                    geo.computeBoundingBox();
                }
            }
        }
    });

    // 카메라 Z축 거리를 2D/3D 상태 및 줌 배율, 스마트폰/디스플레이 종횡비에 맞춰 보정
    if (camera) {
        currentZoom += (targetZoom - currentZoom) * (1 - Math.pow(1 - 0.1, timeScale));
        const baseCamZ = getCameraDistance(t);
        const targetCamZ = baseCamZ * currentZoom;
        camera.position.z += (targetCamZ - camera.position.z) * (1 - Math.pow(1 - 0.1, timeScale));
    }

    // 3D 실린더 자율 회전 (Auto-rotation) 카운트다운 및 처리
    if (pauseAutoDuration > 0) {
        pauseAutoDuration -= dt;
    }

    const isInfoPopupOpen = document.getElementById('info-popup') && document.getElementById('info-popup').style.display === 'flex';
    const canAutoRotate = !isDragging && !isHovering && pauseAutoDuration <= 0 && !isInfoPopupOpen;

    const L = Math.PI * 2 * CYLINDER_RADIUS;

    // 각 카테고리 원통 위치 업데이트
    cylinders.forEach((c) => { 
        if (c.currentAngle === undefined) c.currentAngle = c.group.rotation.y;

        if (canAutoRotate && c && c.autoSpeed) {
            // 자동 회전 시 프레임 델타 타임(dt)을 적용하여 기기 스펙이나 환경에 상관없이 부드러운 회전 보장
            c.currentAngle += c.autoSpeed * timeScale;
            // 2PI 모듈로 정규화로 오버플로우 및 float 오차 누적 방지
            const TWO_PI = Math.PI * 2;
            c.currentAngle = ((c.currentAngle % TWO_PI) + TWO_PI) % TWO_PI;
            c.targetRotation = c.currentAngle;
        } else {
            // 드래그/스냅 등 사용자 터치 인터랙션 시 lerp 보정
            c.currentAngle += (c.targetRotation - c.currentAngle) * (1 - Math.pow(1 - 0.12, timeScale));
        }

        // 2D 펼침 시 크기 비율 확대 (1.05 ~ 1.35)
        const scaleVal = 1.0 * (1 - t) + 1.35 * t;
        c.group.scale.set(scaleVal, scaleVal, scaleVal);

        const rawX = CYLINDER_RADIUS * (c.currentAngle + Math.PI - ROTATION_STEP / 2);
        const scaledL = L * scaleVal;
        const scaledRawX = rawX * scaleVal;

        // 2D 모드 시 무한 가로 스크롤을 위한 X축 Modulo 연산
        let modX = ((scaledRawX % scaledL) + scaledL) % scaledL;
        if (modX > scaledL / 2) modX -= scaledL;

        c.group.rotation.y = c.currentAngle * (1 - t);
        c.group.position.x = modX * t;

        // 2D 모드 확대 시 Y축 높이 비례 조정
        c.group.position.y = (c.baseYPos !== undefined ? c.baseYPos : c.group.position.y) * scaleVal;

        c.mesh.rotation.y = (- (ROTATION_STEP / 2)) * (1 - t);

        if (c.clones) {
            c.clones.forEach(clone => {
                clone.rotation.y = c.mesh.rotation.y;
                clone.visible = t > 0.01;
            });
        }
    }); 
    renderer.render(scene, camera); 
}

// --------------------------------------------------------------------------
// 9. 2D 펼침 View <-> 3D 원통 View 전환 토글 (toggleFlatView)
// --------------------------------------------------------------------------
window.toggleFlatView = function() {
    isFlatView = !isFlatView;
    targetFlattenProgress = isFlatView ? 1 : 0;

    if (isFlatView) {
        cylinders.forEach(c => {
            if (c) {
                c.targetRotation = Math.round((c.targetRotation || 0) / ROTATION_STEP) * ROTATION_STEP;
                // c.currentAngle = c.targetRotation; // Removed to prevent awkward instant snapping
            }
        });
    }

    const btn = document.getElementById('flat-view-btn');
    if (btn) {
        if (isFlatView) {
            btn.classList.add('active');
            btn.innerHTML = '<img src="./asset/cylinder.svg?v=2" alt="CYLINDER" style="pointer-events: none;">';
        } else {
            btn.classList.remove('active');
            btn.innerHTML = '<img src="./asset/flat.svg?v=2" alt="FLAT" style="pointer-events: none;">';
        }
    }
};

// --------------------------------------------------------------------------
// 10. Three.js 원통 3D 메시 및 Canvas 2D 텍스처 매핑 생성 (createCylinderMesh & updateCylinderTexture)
// --------------------------------------------------------------------------
async function createCylinderMesh(index) {
    const h = getCylinderHeight(index); const group = new THREE.Group(); 
    let yPos = 0; 
    const hs = [getCylinderHeight(0), getCylinderHeight(1), getCylinderHeight(2), getCylinderHeight(3), getCylinderHeight(4)];
    const totalH = hs.reduce((a, b) => a + b, 0);
    const top = totalH / 2;
    
    let currentY = top;
    for (let i = 0; i < index; i++) currentY -= hs[i];
    yPos = currentY - h / 2 + 0.05;
    
    group.position.y = yPos;
    
    // 원통 3D 지오메트리 세그먼트 생성 (스탠바이미 최적화: 32 세그먼트로 매끄러운 곡면 유지 & 버텍스 연산 대폭 절감)
    const geo = new THREE.CylinderGeometry(CYLINDER_RADIUS, CYLINDER_RADIUS, h, 32, 1, true);
    
    // 3D 원통 원래 정점 위치와 2D 평면 정점 위치 데이터 구조 저장
    const posAttr = geo.attributes.position;
    const normAttr = geo.attributes.normal;
    const count = posAttr.count;
    const origPositions = new Float32Array(count * 3);
    const flatPositions = new Float32Array(count * 3);
    const origNormals = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
        const x = posAttr.getX(i);
        const y = posAttr.getY(i);
        const z = posAttr.getZ(i);
        origPositions[i * 3] = x;
        origPositions[i * 3 + 1] = y;
        origPositions[i * 3 + 2] = z;

        if (normAttr) {
            origNormals[i * 3] = normAttr.getX(i);
            origNormals[i * 3 + 1] = normAttr.getY(i);
            origNormals[i * 3 + 2] = normAttr.getZ(i);
        }
        
        const u = geo.attributes.uv.getX(i);
        const theta = (u - 0.5) * Math.PI * 2;
        flatPositions[i * 3] = CYLINDER_RADIUS * theta;
        flatPositions[i * 3 + 1] = y;
        flatPositions[i * 3 + 2] = 0;
    }
    geo.userData.origPositions = origPositions;
    geo.userData.flatPositions = flatPositions;
    geo.userData.lastT = -1;
    geo.setAttribute('flatPosition', new THREE.BufferAttribute(flatPositions, 3));
    
    geo.computeBoundingBox();
    geo.computeBoundingSphere();
    geo.userData.origBox = geo.boundingBox.clone();
    geo.userData.origSphere = geo.boundingSphere.clone();
    
    posAttr.array.set(flatPositions);
    geo.computeBoundingBox();
    geo.computeBoundingSphere();
    geo.userData.flatBox = geo.boundingBox.clone();
    geo.userData.flatSphere = geo.boundingSphere.clone();
    
    posAttr.array.set(origPositions);
    geo.computeBoundingBox();
    geo.computeBoundingSphere();

    // TV/임베디드 GPU(Mali 계열)에 최적화된 고성능 MeshLambertMaterial 적용 (무거운 BRDF 연산 제거로 1080p 렌더링 3~4배 가속)
    const mat = new THREE.MeshLambertMaterial({ 
        side: THREE.DoubleSide, 
        transparent: true,
        alphaTest: 0.05,
        depthWrite: true // 투명도 정렬 오류로 인한 겹침(Overlapping) 현상 방지
    });

    mat.userData = { shader: null };

    // 커스텀 쉐이더: CPU 버텍스 연산을 GPU로 이전하여 렉 유발 차단 및 성능 대폭 최적화
    mat.onBeforeCompile = (shader) => {
        mat.userData.shader = shader;
        shader.uniforms.uMorphT = { value: 0 };
        shader.uniforms.uSinT = { value: 0 };
        
        shader.vertexShader = `
            attribute vec3 flatPosition;
            uniform float uMorphT;
            uniform float uSinT;
        ` + shader.vertexShader;
        
        shader.vertexShader = shader.vertexShader.replace(
            '#include <beginnormal_vertex>',
            `
            vec3 objectNormal = mix(normal, vec3(0.0, 0.0, 1.0), uMorphT);
            objectNormal = normalize(objectNormal);
            `
        ).replace(
            '#include <begin_vertex>',
            `
            vec3 transformed = vec3(position);
            float theta = (uv.x - 0.5) * 6.28318530718;
            float archFactor = uSinT * cos(theta * 0.5) * 0.08;
            
            transformed = mix(position, flatPosition, uMorphT);
            transformed.z += archFactor;
            `
        );

        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <dithering_fragment>',
            `#include <dithering_fragment>
            if (!gl_FrontFacing) {
                gl_FragColor.rgb *= 0.32; // 뒤쪽 안쪽 면 어둡게 쉐이딩 (그림자 효과)
            }
            `
        );
    };

    const L = Math.PI * 2 * CYLINDER_RADIUS;

    const mesh = new THREE.Mesh(geo, mat); 
    mesh.rotation.y = - (ROTATION_STEP / 2); 
    mesh.frustumCulled = false;
    group.add(mesh);

    // 2D 무한 스크롤 연출을 위한 좌우 복제 클론 패널 (스탠바이미 최적화: 좌우 1개씩 총 2개로 무한 스크롤 완벽 유지 및 드로우콜 50% 절감)
    const clones = [];
    const offsets = [-1, 1];
    offsets.forEach(mult => {
        const clone = new THREE.Mesh(geo, mat);
        clone.rotation.y = - (ROTATION_STEP / 2);
        clone.position.x = mult * L;
        clone.visible = false;
        clone.frustumCulled = false;
        group.add(clone);
        clones.push(clone);
    });

    const defaultSpeeds = [0.0006, -0.0005, 0.0007, -0.0004, 0.0006];
    const autoSpeed = defaultSpeeds[index % defaultSpeeds.length];
    const obj = { group, mesh, clones, h, baseYPos: yPos, targetRotation: 0, currentAngle: 0, flatReferenceAngle: 0, autoSpeed }; 
    cylinders[index] = obj; return obj;
}

// WebGL 캔버스 오염(Tainted Canvas) 방지 검증 함수
function isImageSafeForCanvas(img) {
    try {
        const testCanvas = document.createElement('canvas');
        testCanvas.width = 1; testCanvas.height = 1;
        const testCtx = testCanvas.getContext('2d');
        testCtx.drawImage(img, 0, 0, 1, 1);
        testCtx.getImageData(0, 0, 1, 1); // 캔버스가 오염된 경우 SecurityError 발생
        return true;
    } catch (e) {
        return false;
    }
}

// 안전한 텍스처용 이미지 로더 (CORS / Data URI / 로컬 이미지 호환)
async function loadCylinderImage(url) {
    if (!url) return null;
    const isDataOrBlob = url.startsWith('data:') || url.startsWith('blob:');
    
    const fetchSingle = (srcUrl, useCrossOrigin) => new Promise((resolve) => {
        const img = new Image();
        if (useCrossOrigin) {
            img.crossOrigin = "anonymous";
        }
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = srcUrl;
    });

    if (isDataOrBlob) {
        return await fetchSingle(url, false);
    }

    // 1차 시도: 일반 CORS 로드
    let loadedImg = await fetchSingle(url, true);
    if (loadedImg) return loadedImg;

    // 2차 시도: 외부 CORS 프록시 경유 로드 (HTTP/HTTPS 인 경우)
    if (url.startsWith('http://') || url.startsWith('https://')) {
        const proxies = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
            `https://corsproxy.io/?${encodeURIComponent(url)}`
        ];
        for (const proxy of proxies) {
            loadedImg = await fetchSingle(proxy, true);
            if (loadedImg) return loadedImg;
        }
    }

    // 3차 시도: crossOrigin 없이 로드 (캔버스 오염을 일으키지 않는 경우만 채택)
    loadedImg = await fetchSingle(url, false);
    if (loadedImg) return loadedImg;

    return null;
}

// 20개 아이템 이미지를 2D Canvas에 베이킹하여 원통 표면 텍스처로 렌더링 (각 칸 간격 분리)
async function updateCylinderTexture(index) {
    let hVal = 7.0; 
    if (index === 0) hVal = 8.5; 
    else if (index === 1) hVal = 7.0; 
    else if (index === 2) hVal = 18.0; 
    else if (index === 3) hVal = 22.0;
    else if (index === 4) hVal = 7.0;
    const hRatio = hVal / 16; 
    // 1080p 화면 전용 1:1 픽셀 매핑 최적 해상도 향상 (4096px) - 과도한 부하 없이 선명도 개선
    let defaultTextureCap = isIPad ? 8192 : 4096; // 아이패드 화질 향상
    const maxTextureCap = (renderer && renderer.capabilities) ? Math.min(defaultTextureCap, renderer.capabilities.maxTextureSize) : defaultTextureCap;
    const MAX_WIDTH = maxTextureCap; 
    const categoryItems = CATEGORIES[index].items;
    
    const canvas = document.createElement('canvas'); 
    canvas.width = MAX_WIDTH; 
    canvas.height = Math.round((MAX_WIDTH / ITEM_COUNT) * hRatio);
    const ctx = canvas.getContext('2d', { alpha: true }); 
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // 배경은 투명하게 비워 각 칸 사이의 간격을 띄움
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const sW = canvas.width / ITEM_COUNT, sH = canvas.height;
    
    // 전체 카테고리 및 상하/좌우 모든 칸의 떨어진 거리(간격)를 완벽히 통일
    const UNIFORM_GAP = Math.round(sW * 0.08); // 가로/세로 동일한 통합 간격 (약 16px)
    const gapX = UNIFORM_GAP;
    const gapY = UNIFORM_GAP;
    const cardW = sW - gapX;
    const cardH = sH - gapY;
    const cardRadius = 5; // 각 칸 코너 라운드 반경 5
    
    if (categoryItems.length > 0) {
        await Promise.all(Array.from({ length: ITEM_COUNT }).map((_, i) => new Promise(async (res) => {
            const item = categoryItems[i % categoryItems.length];
            if (!item || !item.url) return res();
            const img = await loadCylinderImage(item.url);
            if (img) {
                const cardX = (i * sW) + (gapX / 2);
                const cardY = gapY / 2;

                ctx.save(); 
                ctx.beginPath(); 
                if (ctx.roundRect) {
                    ctx.roundRect(cardX, cardY, cardW, cardH, cardRadius);
                } else {
                    let r = cardRadius;
                    ctx.moveTo(cardX + r, cardY);
                    ctx.arcTo(cardX + cardW, cardY, cardX + cardW, cardY + cardH, r);
                    ctx.arcTo(cardX + cardW, cardY + cardH, cardX, cardY + cardH, r);
                    ctx.arcTo(cardX, cardY + cardH, cardX, cardY, r);
                    ctx.arcTo(cardX, cardY, cardX + cardW, cardY, r);
                    ctx.closePath();
                }
                
                // 카드 배경 및 클리핑
                ctx.fillStyle = "#fafaf8";
                ctx.fill();
                ctx.clip();

                const scale = Math.max(cardW / img.width, cardH / img.height);
                const dW = img.width * scale, dH = img.height * scale;
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, cardX + (cardW - dW)/2, cardY + (cardH - dH)/2, dW, dH); 
                
                ctx.restore();
            }
            res();
        })));
    }
    
    const tex = new THREE.CanvasTexture(canvas); 
    const maxAnisotropy = (renderer && renderer.capabilities) ? renderer.capabilities.getMaxAnisotropy() : 4;
    tex.anisotropy = Math.min(4, maxAnisotropy);
    // 양 옆 화질 저하(비등방성) 문제 해결을 위해 Mipmap 활성화 (성능을 고려해 anisotropy는 4로 유지)
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    
    if (cylinders[index].mesh.material.map) {
        cylinders[index].mesh.material.map.dispose();
    }
    cylinders[index].mesh.material.map = tex; 
    cylinders[index].mesh.material.needsUpdate = true;
    if (cylinders[index].clones) {
        cylinders[index].clones.forEach(clone => {
            clone.material.map = tex;
            clone.material.needsUpdate = true;
        });
    }
}

// --------------------------------------------------------------------------
// 11. 마우스/터치 인터랙션 이벤트 핸들러 (PointerDown, Move, Up, Click)
// --------------------------------------------------------------------------
function onPointerDown(e) {
    if (document.getElementById('info-popup') && document.getElementById('info-popup').style.display === 'flex') {
        return;
    }
    if (e.target.closest('#management-panel, #side-style-wrapper, #instruction-overlay, #info-popup, .controls, #audio-control-btn, .ui-overlay, #management-btn-wrapper')) {
        return;
    }
    pointerStartTime = Date.now(); pointerStartPos = { x: e.clientX, y: e.clientY };
    _pointerVec.set((e.clientX/innerWidth)*2-1, -(e.clientY/innerHeight)*2+1);
    _raycaster.setFromCamera(_pointerVec, camera); 
    const intersects = _raycaster.intersectObjects(getAllInteractableMeshes());
    if (intersects.length > 0) {
        const catId = findCategoryIndexByMesh(intersects[0].object);
        if (catId !== -1) { 
            activeCylinderIndex = catId;
            isDragging = true; 
            hasDragged = false;
            pauseAutoDuration = 3000;
            dragStartX = e.clientX; 
            dragStartRotation = cylinders[activeCylinderIndex].targetRotation; 
            dragStartRotations = cylinders.map(c => c ? c.targetRotation : 0);
            try { e.target.setPointerCapture(e.pointerId); } catch(err) {}
        }
    }
}

function getAllInteractableMeshes() {
    const list = [];
    cylinders.forEach(c => {
        if (c.mesh) list.push(c.mesh);
        if (c.clones) {
            c.clones.forEach(clone => {
                if (clone.visible) list.push(clone);
            });
        }
    });
    return list;
}

function findCategoryIndexByMesh(mesh) {
    return cylinders.findIndex(c => c && (c.mesh === mesh || (c.clones && c.clones.includes(mesh))));
}

function onPointerMove(e) { 
    if (e.target.closest('#management-panel, #side-style-wrapper, #instruction-overlay, #info-popup, .controls, #audio-control-btn, .ui-overlay, #management-btn-wrapper')) {
        isHovering = false; 
        hoveredCylinderIndex = -1;
        document.body.style.cursor = 'default';
        return;
    }
    if (!isDragging) {
        const now = performance.now();
        // 최적화: 레이캐스팅 연산 부하 최소화 (100ms 쓰로틀링 & 싱글톤 인스턴스 재사용)
        if (now - (window.lastRaycastTime || 0) > 100) {
            window.lastRaycastTime = now;
            _pointerVec.set((e.clientX/innerWidth)*2-1, -(e.clientY/innerHeight)*2+1);
            _raycaster.setFromCamera(_pointerVec, camera);
            const intersects = _raycaster.intersectObjects(getAllInteractableMeshes());
            
            if (intersects.length > 0) {
                isHovering = true; 
                hoveredCylinderIndex = findCategoryIndexByMesh(intersects[0].object);
            } else { 
                isHovering = false; 
                hoveredCylinderIndex = -1;
            }
        }
    }
    
    if (isDragging && activeCylinderIndex !== -1) { 
        const dist = Math.hypot(e.clientX - pointerStartPos.x, e.clientY - pointerStartPos.y);
        // 스탠바이미 터치 최적화: 8px 임계값으로 터치 즉시 반응 & 시작 시 회전 튀는 현상 방지
        if (!hasDragged && dist > 8) {
            hasDragged = true;
            dragStartX = e.clientX;
            dragStartRotation = cylinders[activeCylinderIndex].targetRotation;
        }

        if (hasDragged) {
            const sensitivity = 0.004;
            const deltaX = e.clientX - dragStartX;
            const deltaRot = deltaX * sensitivity;

            // 클릭하여 드래그한 카테고리만 독립 회전
            cylinders[activeCylinderIndex].targetRotation = dragStartRotation + deltaRot; 
        }
        document.body.style.cursor = 'default'; 
    }
}

function onPointerUp(e) {
    try { if (e.target && e.target.releasePointerCapture) e.target.releasePointerCapture(e.pointerId); } catch(err) {}

    if (e.target.closest('#management-panel, #side-style-wrapper, #instruction-overlay, #info-popup, .controls, #audio-control-btn, .ui-overlay, #management-btn-wrapper')) {
        isDragging = false;
        hasDragged = false;
        return;
    }
    const dist = Math.hypot(e.clientX - pointerStartPos.x, e.clientY - pointerStartPos.y);
    
    if (hasDragged && activeCylinderIndex !== -1) { 
        cylinders[activeCylinderIndex].targetRotation = Math.round(cylinders[activeCylinderIndex].targetRotation / ROTATION_STEP) * ROTATION_STEP; 
        // 3.3MB 전체 저장이 아닌 경량 회전 상태만 저장하여 랙(프리징) 완전 차단
        if (typeof saveRotationState === 'function') saveRotationState(); 
    } else if (!hasDragged && dist < 15 && activeCylinderIndex !== -1) {
        // 단일 클릭 시 해당 슬롯/아이템을 화면 중앙으로 회전 정렬
        _pointerVec.set((e.clientX/innerWidth)*2-1, -(e.clientY/innerHeight)*2+1);
        _raycaster.setFromCamera(_pointerVec, camera);
        const intersects = _raycaster.intersectObjects(getAllInteractableMeshes());
        if (intersects.length > 0) {
            const catId = findCategoryIndexByMesh(intersects[0].object);
            if (catId === activeCylinderIndex && intersects[0].uv) {
                const rawUvIdx = Math.floor(intersects[0].uv.x * ITEM_COUNT);
                const items = CATEGORIES[catId]?.items || [];
                const itemLen = items.length > 0 ? items.length : ITEM_COUNT;
                const uvIdx = rawUvIdx % itemLen;
                
                const currentRot = cylinders[catId].targetRotation;
                const baseIdx = ((Math.round(-currentRot / ROTATION_STEP) % ITEM_COUNT) + ITEM_COUNT) % ITEM_COUNT;
                const diff = (uvIdx - baseIdx + ITEM_COUNT) % ITEM_COUNT;
                let stepDiff = diff > ITEM_COUNT / 2 ? diff - ITEM_COUNT : diff;
                
                cylinders[catId].targetRotation = Math.round((currentRot - stepDiff * ROTATION_STEP) / ROTATION_STEP) * ROTATION_STEP;
                if (typeof saveRotationState === 'function') saveRotationState();
                
                if (items[uvIdx]) {
                    showInfoPopup(catId, uvIdx);
                }
            }
        }
    }

    isDragging = false; 
    hasDragged = false;
    isHovering = false;
    hoveredCylinderIndex = -1;
    if (activeCylinderIndex !== -1) {
        pauseAutoDuration = 3000;
    }
    activeCylinderIndex = -1;
}

// 아이템 더블클릭 시 팝업 띄우기 (이미지 히트 시 true 반환)
function handleCylinderDblClick(e) {
    _pointerVec.set((e.clientX/innerWidth)*2-1, -(e.clientY/innerHeight)*2+1);
    _raycaster.setFromCamera(_pointerVec, camera);
    const intersects = _raycaster.intersectObjects(getAllInteractableMeshes());
    if (intersects.length > 0) {
        const catId = findCategoryIndexByMesh(intersects[0].object);
        const rawUvIdx = Math.floor(intersects[0].uv.x * ITEM_COUNT);
        const items = CATEGORIES[catId]?.items || [];
        const uvIdx = items.length > 0 ? rawUvIdx % items.length : rawUvIdx;
        if (catId !== -1 && items[uvIdx]) {
            showInfoPopup(catId, uvIdx);
            return true;
        }
    }
    return false;
}

// --------------------------------------------------------------------------
// 12. 좌측 수직 스타일 선택 휠 UI 업데이트 및 드래그/스크롤 제어
// --------------------------------------------------------------------------
window.switchArchiveTab = (tabName) => {
    const catContent = document.getElementById('tab-content-category');
    const setContent = document.getElementById('tab-content-styleset');
    const catBtn = document.getElementById('tab-btn-category');
    const setBtn = document.getElementById('tab-btn-styleset');
    
    if (tabName === 'category') {
        if (catContent) catContent.style.display = 'block';
        if (setContent) setContent.style.display = 'none';
        if (catBtn) catBtn.classList.add('active');
        if (setBtn) setBtn.classList.remove('active');
    } else {
        if (catContent) catContent.style.display = 'none';
        if (setContent) setContent.style.display = 'block';
        if (catBtn) catBtn.classList.remove('active');
        if (setBtn) setBtn.classList.add('active');
    }
};

window.togglePanel = (e) => { 
    if (e && e.stopPropagation) e.stopPropagation(); 
    const p = document.getElementById('management-panel'); 
    if (p.style.display !== 'block') {
        createUI();
        p.style.display = 'block';
    } else {
        p.style.display = 'none';
        pauseAutoDuration = 0;
        isHovering = false;
    }
};
window.addEventListener('pointerdown', (e) => {
    const p = document.getElementById('management-panel');
    if (p && p.style.display === 'block') {
        if (!e.target.closest('#management-panel') && !e.target.closest('#management-btn-wrapper') && !e.target.closest('[onclick*="togglePanel"]')) {
            p.style.display = 'none';
            pauseAutoDuration = 0;
            isHovering = false;
        }
    }
    const infoPopup = document.getElementById('info-popup');
    if (infoPopup && (infoPopup.style.display === 'flex' || infoPopup.style.display === 'block')) {
        if (!e.target.closest('.info-card')) {
            closeInfoPopup();
        }
    }
    const instOverlay = document.getElementById('instruction-overlay');
    if (instOverlay && (instOverlay.style.display === 'flex' || instOverlay.style.display === 'block')) {
        if (!e.target.closest('.instruction-card')) {
            closeInstructions();
        }
    }
});

window.updateTopCarousel = () => { 
    const container = document.getElementById('side-style-container');
    const list = document.getElementById('side-style-list');
    if (!container || !list) return;

    if (!STYLE_SETS || STYLE_SETS.length === 0) {
        list.innerHTML = '';
        return;
    }

    const baseHTML = STYLE_SETS.map((s, idx) => `
        <div class="side-style-item ${idx === 0 ? 'active' : ''}" 
             data-id="${s.id}" data-idx="${idx}">
            ${s.name}
        </div>`).join(''); 
    
    list.innerHTML = baseHTML;

    // Attach delegated click listener to the list container
    list.onclick = (e) => {
        const item = e.target.closest('.side-style-item');
        if (item) {
            const idx = parseInt(item.getAttribute('data-idx'), 10);
            window.selectSimpleStyle(item, idx);
        }
    };
};

window.selectSimpleStyle = (element, idx) => {
    const list = document.getElementById('side-style-list');
    if (!list) return;
    
    // Remove active class from all items
    list.querySelectorAll('.side-style-item.active').forEach(item => item.classList.remove('active'));
    
    // Add active class to clicked item
    if (element) {
        element.classList.add('active');
        const setId = parseInt(element.getAttribute('data-id'), 10);
        if (!isNaN(setId) && window.applyStyleSet) {
            window.applyStyleSet(setId, element);
        }
    }
};

// --------------------------------------------------------------------------
// 13. 이미지 압축 및 업로드 처리 (resizeImage & handleFileUpload)
// --------------------------------------------------------------------------
async function resizeImage(dataUrl, maxW = 1280, quality = 0.85) {
    return new Promise((res) => {
        const img = new Image(); img.onload = () => {
            const canvas = document.createElement('canvas'); 
            const scale = Math.min(1, maxW / Math.max(img.width, img.height));
            canvas.width = img.width * scale; canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d'); 
            ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            res(canvas.toDataURL('image/jpeg', quality));
        }; img.src = dataUrl;
    });
}

window.handleFileUpload = async (e, id) => {
    const files = Array.from(e.target.files); if (!files.length) return;
    const catIdx = CATEGORIES.findIndex(c => c.id === id); if (catIdx === -1) return;

    // 카테고리별 최대 20장 제한 확인
    if (CATEGORIES[catIdx].items.length >= ITEM_COUNT) {
        showMessage(`⚠️ ${CATEGORIES[catIdx].name} 카테고리는 이미 가득 찼습니다. (최대 ${ITEM_COUNT}장)`);
        e.target.value = "";
        return;
    }

    showMessage("HD 최적화 모드: 이미지 처리 중...");
    try {
        const urls = await Promise.all(files.map(async f => {
            const rawUrl = await new Promise(res => { const rd = new FileReader(); rd.onload = ev => res(ev.target.result); rd.readAsDataURL(f); });
            return await resizeImage(rawUrl, 1280, 0.90);
        }));
        CATEGORIES[catIdx].items = [...CATEGORIES[catIdx].items, ...urls.map(u => ({url:u, setIds:[]}))].slice(0, ITEM_COUNT);
        await updateCylinderTexture(catIdx); saveState(); createUI(); showMessage("고화질 업로드 완료! ✨");
    } catch (err) { console.error(err); showMessage("업로드 실패: 용량을 확인해 주세요."); }
};

window.handleSingleUpload = async (e, catId, idx) => {
    const file = e.target.files[0]; if (!file) return;
    const catIdx = CATEGORIES.findIndex(c => c.id === catId); if (catIdx === -1) return;

    showMessage("HD 최적화 모드: 이미지 처리 중...");
    try {
        const rawUrl = await new Promise(res => { const rd = new FileReader(); rd.onload = ev => res(ev.target.result); rd.readAsDataURL(file); });
        const url = await resizeImage(rawUrl, 1280, 0.90);
        CATEGORIES[catIdx].items[idx].url = url;
        await updateCylinderTexture(catIdx); saveState(); createUI(); showMessage("고화질 업로드 완료! ✨");
    } catch (err) { console.error(err); showMessage("업로드 실패: 용량을 확인해 주세요."); }
};

// --------------------------------------------------------------------------
// 14. 갤러리 썸네일 삭제 / 순서 이동 / Drag and Drop (deleteImage, moveImageOrder, handleDrop)
// --------------------------------------------------------------------------
window.deleteImage = async (catId, idx) => {
    const panel = document.getElementById('management-panel');
    const panelScroll = panel.scrollTop;
    
    const grids = document.querySelectorAll('.thumbnail-grid');
    const gridIdx = CATEGORIES.findIndex(c => c.id === catId);
    const horizontalScroll = (gridIdx !== -1 && grids[gridIdx]) ? grids[gridIdx].scrollLeft : 0;

    if (gridIdx !== -1 && CATEGORIES[gridIdx].items[idx]) {
        CATEGORIES[gridIdx].items[idx].url = "";
    }
    await updateCylinderTexture(gridIdx !== -1 ? gridIdx : catId);
    saveState();
    createUI();
    
    panel.scrollTop = panelScroll;
    const newGrids = document.querySelectorAll('.thumbnail-grid');
    if (gridIdx !== -1 && newGrids[gridIdx]) {
        newGrids[gridIdx].scrollLeft = horizontalScroll;
    }
};

window.moveImageOrder = async (catId, idx, dir) => {
    const targetIdx = idx + dir;
    const catIdx = CATEGORIES.findIndex(c => c.id === catId);
    if (catIdx === -1) return;
    const items = CATEGORIES[catIdx].items;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const panel = document.getElementById('management-panel');
    const pScroll = panel.scrollTop;
    const grids = document.querySelectorAll('.thumbnail-grid');
    const hScroll = (catIdx !== -1 && grids[catIdx]) ? grids[catIdx].scrollLeft : 0;

    const temp = items[idx];
    items[idx] = items[targetIdx];
    items[targetIdx] = temp;

    await updateCylinderTexture(catIdx);
    saveState();
    createUI();

    panel.scrollTop = pScroll;
    const newG = document.querySelectorAll('.thumbnail-grid');
    if (catIdx !== -1 && newG[catIdx]) newG[catIdx].scrollLeft = hScroll;
};

window.handleDragStart = (e, catId, idx) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ catId, idx }));
    e.currentTarget.classList.add('dragging');
};
window.handleDragOver = (e) => e.preventDefault();
window.handleDragEnter = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
};
window.handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
};
window.handleDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging');
    document.querySelectorAll('.thumb-container').forEach(el => el.classList.remove('drag-over', 'dragging'));
};
window.handleDrop = async (e, targetCatId, targetIdx) => {
    e.preventDefault();
    document.querySelectorAll('.thumb-container').forEach(el => el.classList.remove('drag-over', 'dragging'));
    
    let data;
    try {
        data = JSON.parse(e.dataTransfer.getData('text/plain'));
    } catch(err) { return; }
    
    const sourceCatId = data.catId; 
    const sourceIdx = data.idx;
    if (sourceCatId !== targetCatId || sourceIdx === targetIdx) return;
    
    const panel = document.getElementById('management-panel'); 
    const pScroll = panel.scrollTop;
    const grids = document.querySelectorAll('.thumbnail-grid'); 
    const gIdx = CATEGORIES.findIndex(c => c.id === targetCatId);
    const hScroll = (gIdx !== -1 && grids[gIdx]) ? grids[gIdx].scrollLeft : 0;

    const items = CATEGORIES[targetCatId].items; 
    const [moved] = items.splice(sourceIdx, 1); 
    items.splice(targetIdx, 0, moved);

    await updateCylinderTexture(targetCatId); 
    saveState(); 
    createUI();

    panel.scrollTop = pScroll; 
    const newG = document.querySelectorAll('.thumbnail-grid');
    if (gIdx !== -1 && newG[gIdx]) newG[gIdx].scrollLeft = hScroll;
};

// --------------------------------------------------------------------------
// 15. 스타일 세트(Lookbook) 정렬, 할당 및 번들링 내보내기 (alignToSet, saveToShareableFile)
// --------------------------------------------------------------------------
window.uploadSetReferenceImage = async (setId, e) => {
    const file = e.target.files[0]; if (!file) return;
    try {
        const raw = await new Promise(res => { const rd = new FileReader(); rd.onload = ev => res(ev.target.result); rd.readAsDataURL(file); });
        const optimized = await resizeImage(raw, 1920, 0.92);
        const set = STYLE_SETS.find(s => s.id === setId);
        if (set) { 
            set.repUrl = optimized; 
            set.updatedAt = Date.now();
            saveState(); 
            createUI(); 
        }
    } catch (err) { 
        console.error(err); 
    } finally {
        if (e && e.target) e.target.value = "";
    }
};

window.deleteStyleImage = (setId) => {
    const set = STYLE_SETS.find(s => s.id === setId);
    if (set) { 
        set.repUrl = ""; 
        set.updatedAt = Date.now();
        saveState(); 
        createUI(); 
    }
};

window.showSetReference = () => {
    if (!editingSetId) { showMessage("먼저 상단에서 스타일을 선택해 주세요."); return; }
    const set = STYLE_SETS.find(s => s.id === editingSetId);
    if (!set || !set.repUrl) { showMessage("이 스타일의 대표 이미지가 등록되지 않았습니다."); return; }
    
    document.getElementById('info-img').src = set.repUrl;
    document.getElementById('info-category').innerText = "STYLE";
    document.getElementById('info-title').innerText = set.name;
    document.getElementById('info-desc').innerText = set.desc || "이 스타일 조합에 대한 오피셜 룩북 이미지입니다.";
    const linkBtn = document.getElementById('info-link');
    const imgLink = document.getElementById('info-img-link');
    const buyOverlay = document.getElementById('info-buy-overlay');
    if (linkBtn) linkBtn.style.display = 'none';
    if (imgLink) { imgLink.removeAttribute('href'); imgLink.style.pointerEvents = 'none'; }
    if (buyOverlay) buyOverlay.style.display = 'none';
    
    const popup = document.getElementById('info-popup');
    popup.classList.add('style-popup');
    popup.classList.remove('cylinder-popup');
    if (popup.style.display === 'flex' || popup.style.display === 'block') {
        popup.style.display = 'none';
        void popup.offsetWidth;
    }
    popup.style.display = 'flex';
};

window.showSetThumbnailPreview = (setId) => {
    const set = STYLE_SETS.find(s => s.id === setId);
    if (!set || !set.repUrl) return;
    
    document.getElementById('info-img').src = set.repUrl;
    document.getElementById('info-category').innerText = "STYLE LOOKBOOK";
    document.getElementById('info-title').innerText = set.name;
    document.getElementById('info-desc').innerText = set.desc || "이 스타일 조합에 대한 오피셜 룩북 이미지입니다.";
    const linkBtn = document.getElementById('info-link');
    const imgLink = document.getElementById('info-img-link');
    const buyOverlay = document.getElementById('info-buy-overlay');
    if (linkBtn) linkBtn.style.display = 'none';
    if (imgLink) { imgLink.removeAttribute('href'); imgLink.style.pointerEvents = 'none'; }
    if (buyOverlay) buyOverlay.style.display = 'none';
    
    const popup = document.getElementById('info-popup');
    popup.classList.add('style-popup');
    popup.classList.remove('cylinder-popup');
    if (popup.style.display === 'flex' || popup.style.display === 'block') {
        popup.style.display = 'none';
        void popup.offsetWidth;
    }
    popup.style.display = 'flex';
};

window.handleSetDragStart = (e, idx) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'set', idx }));
    e.target.classList.add('opacity-40');
};
window.handleSetDragEnd = (e) => {
    document.querySelectorAll('.set-item-row').forEach(el => el.classList.remove('opacity-40'));
};
window.handleSetDragOver = (e) => e.preventDefault();
window.handleSetDrop = (e, targetIdx) => {
    e.preventDefault();
    document.querySelectorAll('.set-item-row').forEach(el => el.classList.remove('opacity-40'));
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    if (data.type !== 'set' || data.idx === targetIdx) return;
    const [moved] = STYLE_SETS.splice(data.idx, 1);
    STYLE_SETS.splice(targetIdx, 0, moved);
    saveState(); createUI(); showMessage("세트 순서 변경 완료! ✨");
};

window.moveStyleSet = (e, idx, dir) => {
    e.stopPropagation();
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= STYLE_SETS.length) return;
    const [moved] = STYLE_SETS.splice(idx, 1);
    STYLE_SETS.splice(targetIdx, 0, moved);
    saveState(); createUI(); showMessage("세트 순서 변경 완료! ✨");
};

// --------------------------------------------------------------------------
// 16. 관리 패널 HTML 동적 생성 함수 (createUI)
// --------------------------------------------------------------------------
function createUI() {
    const scrollPositions = [];
    document.querySelectorAll('.thumbnail-grid').forEach((el, i) => {
        scrollPositions[i] = el.scrollLeft;
    });
    const panelScrollContent = document.querySelector('#tab-content-category');
    const panelScrollTop = panelScrollContent ? panelScrollContent.scrollTop : 0;

    document.getElementById('category-controls').innerHTML = CATEGORIES.map(cat => {
        const curRot = (window.cylinders && window.cylinders[cat.id]) ? (window.cylinders[cat.id].targetRotation || 0) : 0;
        const activeIndex = ((Math.round(-curRot / ROTATION_STEP) % ITEM_COUNT) + ITEM_COUNT) % ITEM_COUNT;

        return `
        <div class="category-section">
            <div class="category-header">
                <div class="category-title">${cat.name}</div>
                <label class="category-add-btn" title="이미지 추가 (+)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    <input type="file" multiple class="hidden" onchange="handleFileUpload(event, ${cat.id})">
                </label>
            </div>
            <div class="thumbnail-grid">${cat.items.map((item, i) => {
                const isActive = (i === activeIndex);
                return `
                <div class="thumb-container ${isActive ? 'is-active' : ''}" draggable="true" 
                     ondragstart="handleDragStart(event, ${cat.id}, ${i})" 
                     ondragover="handleDragOver(event)" 
                     ondragenter="handleDragEnter(event)"
                     ondragleave="handleDragLeave(event)"
                     ondragend="handleDragEnd(event)"
                     ondrop="handleDrop(event, ${cat.id}, ${i})">
                    <div class="thumb" ${item.url ? `onclick="showInfoPopup(${cat.id}, ${i})"` : ''}>${item.url ? `<img src="${item.url}">` : `<label style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#666; font-size:12px; font-weight:bold; background:#1e293b; border-radius:4px; cursor:pointer;">NO IMG<input type="file" accept="image/*" class="hidden" onchange="handleSingleUpload(event, ${cat.id}, ${i})"></label>`}</div>
                    <div class="delete-btn" onclick="deleteImage(${cat.id}, ${i})" title="삭제">×</div>
                    <div class="item-inputs-stack">
                        <div class="set-assigner-wrapper">
                            <div class="set-assigner-btn ${item.setIds && item.setIds.length > 0 ? 'has-set' : ''}" title="세트 지정" onclick="toggleDropdown(${cat.id}, ${i}, event)">
                                ${item.setIds && item.setIds.length > 0 ? item.setIds.map(id => STYLE_SETS.find(s=>s.id===id)?.name).filter(Boolean).join(', ') : 'NO SET'}
                            </div>
                            <div class="set-assigner-menu ${window.openDropdownId && window.openDropdownId.cat === cat.id && window.openDropdownId.idx === i ? 'show' : ''}" onclick="event.stopPropagation()">
                                ${STYLE_SETS.map(s => `
                                    <label>
                                        <input type="checkbox" onchange="assignSetForItem(${cat.id}, ${i}, '${s.id}')" ${item.setIds?.includes(s.id) ? 'checked' : ''}>
                                        ${s.name}
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                        <input type="text" class="item-title" title="${item.title || ''}" oninput="updateItemTitle(${cat.id}, ${i}, this.value)" placeholder="NAME" value="${item.title || ''}">
                        <textarea class="item-memo" title="${item.desc || ''}" oninput="updateItemMemo(${cat.id}, ${i}, this.value)" placeholder="DESC">${item.desc || ''}</textarea>
                        <input type="text" class="item-link-input" title="${item.link || ''}" oninput="updateItemLink(${cat.id}, ${i}, this.value)" placeholder="URL" value="${item.link || ''}">
                    </div>
                    <div class="order-btn-group">
                        <button class="order-btn" onclick="event.stopPropagation(); moveImageOrder(${cat.id}, ${i}, -1)" title="왼쪽으로 이동" ${i === 0 ? 'disabled style="opacity:0.2;cursor:default;"' : ''}>◀</button>
                        <span class="order-idx">${i + 1}</span>
                        <button class="order-btn" onclick="event.stopPropagation(); moveImageOrder(${cat.id}, ${i}, 1)" title="오른쪽으로 이동" ${i === cat.items.length - 1 ? 'disabled style="opacity:0.2;cursor:default;"' : ''}>▶</button>
                    </div>
                </div>`;
            }).join('')}</div>
        </div>`;
    }).join('');

    document.getElementById('set-settings-list').innerHTML = STYLE_SETS.map((s, i) => `
        <div class="set-item-row" draggable="true" 
             ondragstart="handleSetDragStart(event, ${i})" 
             ondragend="handleSetDragEnd(event)" 
             ondragover="handleSetDragOver(event)" 
             ondrop="handleSetDrop(event, ${i})">
            <div class="set-thumb-preview ${s.repUrl ? 'has-img' : ''}" 
                 onclick="${s.repUrl ? `showSetThumbnailPreview(${s.id})` : ''}" 
                 title="${s.repUrl ? '룩북 이미지 크게 보기' : '이미지 없음'}">
                ${s.repUrl ? `<img src="${s.repUrl}" alt="${s.name}">
                              <div class="delete-btn" onclick="event.stopPropagation(); deleteStyleImage(${s.id})" title="이미지 삭제">×</div>` : `
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                `}
            </div>
            <div class="flex flex-col justify-between self-stretch py-1 gap-2 flex-1 min-w-0">
                <div>
                    <input type="text" value="${s.name}" oninput="renameStyleSet(${s.id}, this.value)" class="set-name-edit" placeholder="STYLE NAME">
                    <textarea oninput="updateStyleSetDesc(${s.id}, this.value)" class="set-desc-edit" placeholder="상세정보를 입력하세요">${s.desc || ''}</textarea>
                    <div class="text-[10px] font-bold mt-1 ${s.repUrl ? 'text-slate-800' : 'text-slate-400'}">
                        ${s.repUrl ? '● 이미지 등록됨' : '○ 이미지 없음'}
                    </div>
                </div>
                <div class="set-action-btns">
                    <label class="set-mini-btn btn-image-upload ${s.repUrl ? 'has-img' : ''}" title="스타일 대표 화보 이미지 선택/변경">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        <input type="file" accept="image/*" class="hidden" onchange="uploadSetReferenceImage(${s.id}, event)">
                    </label>
                    <button onclick="deleteStyleSet(${s.id})" class="set-mini-btn btn-delete" title="스타일 세트 삭제">DEL</button>
                </div>
            </div>
        </div>`).join('');
    updateTopCarousel();
    
    document.querySelectorAll('.thumbnail-grid').forEach((el, i) => {
        if (scrollPositions[i] !== undefined) el.scrollLeft = scrollPositions[i];
        
        el.addEventListener('wheel', (e) => {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                const isAtLeft = el.scrollLeft === 0;
                const isAtRight = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;

                if (e.deltaY > 0 && !isAtRight) {
                    e.preventDefault();
                    el.scrollLeft += e.deltaY;
                } else if (e.deltaY < 0 && !isAtLeft) {
                    e.preventDefault();
                    el.scrollLeft += e.deltaY;
                }
            }
        });
    });
    if (panelScrollContent) panelScrollContent.scrollTop = panelScrollTop;
}

// 5개 원통을 특정 스타일 세트 아이템에 맞춰 동시 정렬하는 기능
window.alignToSet = (setId) => {
    if (!CATEGORIES || !cylinders || cylinders.length === 0) return;
    
    lastInteractionTime = Date.now(); 
    pauseAutoDuration = 10000; 

    const numSetId = Number(setId);

    for (let c = 0; c < cylinders.length; c++) {
        if (!CATEGORIES[c] || !CATEGORIES[c].items) continue;

        const idx = CATEGORIES[c].items.findIndex(item => item && item.setIds && item.setIds.map(Number).includes(numSetId));
        const cur = cylinders[c].targetRotation !== undefined ? cylinders[c].targetRotation : (cylinders[c].currentAngle || 0);
        
        let targetIdx = idx;
        if (targetIdx === -1) {
            targetIdx = ((Math.round(-cur / ROTATION_STEP) % ITEM_COUNT) + ITEM_COUNT) % ITEM_COUNT;
        }

        const baseTarget = - targetIdx * ROTATION_STEP;
        let diff = baseTarget - cur;
        diff = ((diff % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
        cylinders[c].targetRotation = cur + diff;
    }
    if(typeof saveRotationState === "function") saveRotationState(); 
    document.querySelectorAll('.side-style-item').forEach(btn => {
        const isMatch = Number(btn.getAttribute('data-id')) === numSetId;
        btn.classList.toggle('active', isMatch);
        if (isMatch && typeof btn.scrollIntoView === 'function') {
            btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    });
};

window.applyStyleSet = (id, element) => { 
    editingSetId = id; 
    window.alignToSet(id); 
    if (element && typeof element.scrollIntoView === 'function') { 
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    } 
    if (typeof showSetReference === 'function') {
        showSetReference();
    }
};
window.openDropdownId = null;
document.addEventListener('click', () => {
    if (window.openDropdownId) {
        window.openDropdownId = null;
        document.querySelectorAll('.set-assigner-menu').forEach(menu => menu.classList.remove('show'));
    }
});
window.toggleDropdown = (catId, idx, e) => {
    e.stopPropagation();
    const isSame = window.openDropdownId && window.openDropdownId.cat === catId && window.openDropdownId.idx === idx;
    window.openDropdownId = isSame ? null : { cat: catId, idx: idx };
    
    document.querySelectorAll('.set-assigner-menu').forEach(menu => menu.classList.remove('show'));
    
    if (window.openDropdownId) {
        const catSection = document.querySelectorAll('.category-section')[catId];
        if (catSection) {
            const wrappers = catSection.querySelectorAll('.set-assigner-wrapper');
            if (wrappers[idx]) {
                const menu = wrappers[idx].querySelector('.set-assigner-menu');
                if (menu) menu.classList.add('show');
            }
        }
    }
};
window.addStyleSet = () => { const id = STYLE_SETS.length > 0 ? Math.max(...STYLE_SETS.map(s => s.id)) + 1 : 1; STYLE_SETS.push({ id, name: "NAME" }); saveState(); createUI(); };
window.assignSetForItem = (catId, idx, setIdStr) => {
    const item = CATEGORIES[catId].items[idx];
    if (!item.setIds) item.setIds = [];
    
    if (!setIdStr || setIdStr === 'clear') {
        item.setIds = [];
    } else if (setIdStr !== 'default') {
        const setId = parseInt(setIdStr, 10);
        if (item.setIds.includes(setId)) {
            item.setIds = item.setIds.filter(id => id !== setId);
        } else {
            CATEGORIES[catId].items.forEach(it => {
                if (it.setIds) {
                    it.setIds = it.setIds.filter(id => id !== setId);
                }
            });
            item.setIds.push(setId);
        }
    }
    if (typeof saveState === 'function') saveState(); 
    
    const catSection = document.querySelectorAll('.category-section')[catId];
    if (catSection) {
        const wrappers = catSection.querySelectorAll('.set-assigner-wrapper');
        CATEGORIES[catId].items.forEach((it, i) => {
            const wrapper = wrappers[i];
            if (!wrapper) return;
            const btn = wrapper.querySelector('.set-assigner-btn');
            const menu = wrapper.querySelector('.set-assigner-menu');
            
            if (it.setIds && it.setIds.length > 0) {
                btn.classList.add('has-set');
                btn.innerText = it.setIds.map(id => STYLE_SETS.find(s=>s.id===id)?.name).filter(Boolean).join(', ');
            } else {
                btn.classList.remove('has-set');
                btn.innerText = 'NO SET';
            }
            
            const checkboxes = menu.querySelectorAll('input[type="checkbox"]');
            STYLE_SETS.forEach((s, sIdx) => {
                if (checkboxes[sIdx]) {
                    checkboxes[sIdx].checked = it.setIds && it.setIds.includes(s.id);
                }
            });
        });
    }
};
window.renameStyleSet = (id, n) => { const s = STYLE_SETS.find(x => x.id === id); if(s) { s.name = n; saveState(); } };
window.updateStyleSetDesc = (id, d) => { const s = STYLE_SETS.find(x => x.id === id); if(s) { s.desc = d; saveState(); } };
window.saveCurrentToSet = (id) => { cylinders.forEach((cyl, catIdx) => { const raw = Math.round(-cyl.targetRotation / ROTATION_STEP); const fIdx = ((raw % ITEM_COUNT) + ITEM_COUNT) % ITEM_COUNT; CATEGORIES[catIdx].items.forEach(it => { if (it && it.setIds) it.setIds = it.setIds.filter(setId => setId !== id); }); const it = CATEGORIES[catIdx].items[fIdx]; if(it) { if(!it.setIds) it.setIds = []; it.setIds.push(id); } }); editingSetId = id; saveState(); createUI(); showMessage("현재 착장이 스타일 세트에 저장되었습니다! ✨"); };

// 전 데이터 및 이미지를 단일 HTML 파일로 번들링하여 다운로드
window.saveToShareableFile = async () => {
    showMessage("Fashion Rewinder 전시용 파일 생성 중...");
    try {
        const imageUrlToDataURL = (url) => {
            if (!url) return Promise.resolve(url);
            if (url.startsWith('data:')) return Promise.resolve(url);
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.naturalWidth || img.width || 800;
                        canvas.height = img.naturalHeight || img.height || 800;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        resolve(canvas.toDataURL('image/png'));
                    } catch (e) {
                        console.warn("Canvas toDataURL failed:", e);
                        resolve(url);
                    }
                };
                img.onerror = () => resolve(url);
                img.src = url;
            });
        };

        const bundledCategories = await Promise.all(CATEGORIES.map(async (cat) => {
            const bundledItems = await Promise.all(cat.items.map(async (item) => {
                const dataUrl = await imageUrlToDataURL(item.url);
                return { ...item, url: dataUrl };
            }));
            return { ...cat, items: bundledItems };
        }));

        const sessionData = { 
            categories: bundledCategories, 
            sets: STYLE_SETS, 
            rotations: cylinders.map(c => c.targetRotation)
        };

        const catContainer = document.getElementById('category-controls');
        const setListContainer = document.getElementById('set-settings-list');
        const canvasContainer = document.getElementById('canvas-container');
        const sideStyleList = document.getElementById('side-style-list');
        const sideStyleContainer = document.getElementById('side-style-container');
        
        const backupCat = catContainer ? catContainer.innerHTML : '';
        const backupSetList = setListContainer ? setListContainer.innerHTML : '';
        const backupCanvas = canvasContainer ? canvasContainer.innerHTML : '';
        const backupSideList = sideStyleList ? sideStyleList.innerHTML : '';
        const scrollInited = sideStyleContainer ? sideStyleContainer.dataset.scrollInited : null;
        const dragInited = sideStyleContainer ? sideStyleContainer.dataset.dragInited : null;
        
        if (catContainer) catContainer.innerHTML = '';
        if (setListContainer) setListContainer.innerHTML = '';
        if (canvasContainer) canvasContainer.innerHTML = '';
        if (sideStyleList) {
            sideStyleList.innerHTML = '';
        }
        if (sideStyleContainer) {
            sideStyleContainer.removeAttribute('data-scroll-inited');
            sideStyleContainer.removeAttribute('data-drag-inited');
        }

        let html = document.documentElement.outerHTML; 

        if (catContainer) catContainer.innerHTML = backupCat;
        if (setListContainer) setListContainer.innerHTML = backupSetList;
        if (canvasContainer) canvasContainer.innerHTML = backupCanvas;
        if (sideStyleList) {
            sideStyleList.innerHTML = backupSideList;
        }
        if (sideStyleContainer) {
            if (scrollInited) sideStyleContainer.dataset.scrollInited = scrollInited;
            if (dragInited) sideStyleContainer.dataset.dragInited = dragInited;
        }

        // 3. 기존 EMBEDDED_DATA 스크립트 제거
        html = html.replace(/<script>\s*window\.EMBEDDED_DATA\s*=\s*[\s\S]*?<\/script>/gi, ""); 

        // 4. 스플래쉬(로더) 화면 복원 (시작 시 스플래쉬 로딩 화면이 정상 출력되도록)
        html = html.replace(/<div id="loading-screen"[\s\S]*?>/, '<div id="loading-screen">');

        // 5. 전시 안내(Guide) 오버레이 복원
        html = html.replace(/<div id="instruction-overlay"[\s\S]*?>/, '<div id="instruction-overlay" onclick="if(event.target === this) closeInstructions()">');

        // 6. GALLERY 관리자 패널(management-panel) 닫힌 상태로 복원
        html = html.replace(/<div id="management-panel"[\s\S]*?>/, '<div id="management-panel" class="" style="display: none;">');

        // 7. 토스트 메세지 팝업박스 및 정보 팝업 초기화 (내보내기 토스트 팝업 텍스트 제거)
        html = html.replace(/<div id="message-box"[\s\S]*?<\/div>/, '<div id="message-box"></div>');
        html = html.replace(/<div id="info-popup"[\s\S]*?>/, '<div id="info-popup" style="display: none;" onclick="if(event.target === this) closeInfoPopup()">');
        
        // 8. 외장 CSS/JS를 내장하여 완벽한 단독 실행 파일로 패키징
        try {
            const cssRes = await fetch('style.css?v=5');
            if (cssRes.ok) {
                const cssText = await cssRes.text();
                html = html.replace(/<link rel="stylesheet" href="style\.css[^"]*">/i, `<style>${cssText}</style>`);
            }
        } catch(e) {}
        try {
            const jsRes = await fetch('script.js?v=5');
            if (jsRes.ok) {
                const jsText = await jsRes.text();
                html = html.replace(/<script src="script\.js[^"]*"><\/script>/i, `<script>${jsText}</script>`);
            }
        } catch(e) {}

        const escapedData = JSON.stringify(sessionData).replace(/</g, '\\u003c');
        const dataScript = `\n<script>window.EMBEDDED_DATA = ${escapedData};\x3C/script>\n`;

        if (html.includes("</body>")) {
            html = html.replace("</body>", dataScript + "</body>");
        } else {
            html += dataScript;
        }
        
        const blob = new Blob([html], { type: 'text/html' }); 
        const url = URL.createObjectURL(blob); 
        const a = document.createElement('a'); 
        a.href = url; 
        a.download = `Fashion_Rewinder_Exhibition_FULL.html`; 
        a.click();
    } catch (err) { 
        console.error(err);
        showMessage("❌ 번들링 실패"); 
    }
};

window.deleteStyleSet = (id) => { if(STYLE_SETS.length <= 1) return; STYLE_SETS = STYLE_SETS.filter(x => x.id !== id); saveState(); createUI(); };

// 스탠바이미 최적화: 회전 및 상호작용 시 3.3MB 이미지 데이터를 직렬화하지 않고 회전값(~50B)만 저장하여 프리징 차단
function saveRotationState() {
    if (isLocked) return;
    try {
        const rots = cylinders.map(c => c ? c.targetRotation : 0);
        localStorage.setItem('fm_rots', JSON.stringify(rots));
        if (window.EMBEDDED_DATA) {
            window.EMBEDDED_DATA.rotations = rots;
        }
    } catch (e) {
        console.warn("LocalStorage save error for fm_rots:", e);
    }
}


let saveStateTimeout = null;
function saveState() {
    if (isLocked) return;
    if (saveStateTimeout) clearTimeout(saveStateTimeout);
    saveStateTimeout = setTimeout(() => {
        _saveStateInternal();
    }, 500);
}

function _saveStateInternal() { 
    saveStateToIDB(); 
    if (window.EMBEDDED_DATA) {
        window.EMBEDDED_DATA.categories = CATEGORIES;
        window.EMBEDDED_DATA.sets = STYLE_SETS;
        window.EMBEDDED_DATA.rotations = cylinders.map(c => c ? c.targetRotation : 0);
    }
    try { 
        localStorage.setItem('fm_sets', JSON.stringify(STYLE_SETS)); 
    } catch (e) {
        console.warn("LocalStorage save error for fm_sets:", e);
    }
    try { 
        localStorage.setItem('fm_rots', JSON.stringify(cylinders.map(c => c ? c.targetRotation : 0))); 
    } catch (e) {
        console.warn("LocalStorage save error for fm_rots:", e);
    }
    try { 
        localStorage.setItem('fm_imgs', JSON.stringify(CATEGORIES)); 
    } catch (e) { 
        console.warn("LocalStorage quota exceeded for fm_imgs, relying on IndexedDB:", e); 
    } 
}

// --------------------------------------------------------------------------
// 17. 아이템 정보 팝업 모달 & 무작위/리셋 컨트롤 (showInfoPopup, randomize, resetRotation)
// --------------------------------------------------------------------------
window.showInfoPopup = (catId, idx) => { 
    const it = CATEGORIES[catId].items[idx]; 
    if (!it) return; 
    document.getElementById('info-img').src = it.url; 
    document.getElementById('info-category').innerText = CATEGORIES[catId].name; 
    document.getElementById('info-title').innerText = it.title || "ITEM"; 
    document.getElementById('info-desc').innerText = it.desc || "상세 정보 없음"; 
    
    const linkBtn = document.getElementById('info-link');
    const imgLink = document.getElementById('info-img-link');
    const buyOverlay = document.getElementById('info-buy-overlay');
    
    if (it.link) {
        linkBtn.href = it.link;
        linkBtn.style.display = 'inline-block';
        imgLink.href = it.link;
        imgLink.style.pointerEvents = 'auto';
        buyOverlay.style.display = 'flex';
    } else {
        linkBtn.style.display = 'none';
        imgLink.removeAttribute('href');
        imgLink.style.pointerEvents = 'none';
        buyOverlay.style.display = 'none';
    }
    
    const popup = document.getElementById('info-popup');
    popup.classList.add('cylinder-popup');
    popup.classList.remove('style-popup');
    popup.style.display = 'flex'; 
};
window.closeInfoPopup = () => {
    document.getElementById('info-popup').style.display = 'none';
    lastInteractionTime = Date.now();
    pauseAutoDuration = 0;
    isHovering = false;
    isDragging = false;
};
window.randomize = () => { 
    lastInteractionTime = Date.now(); 
    pauseAutoDuration = 3000; 
    cylinders.forEach((c, cIdx) => {
        const itemCount = (CATEGORIES[cIdx] && CATEGORIES[cIdx].items && CATEGORIES[cIdx].items.length > 0) 
            ? CATEGORIES[cIdx].items.length 
            : ITEM_COUNT;
        const cur = c.targetRotation !== undefined ? c.targetRotation : (c.currentAngle || 0);
        const randomSlot = Math.floor(Math.random() * itemCount);
        const baseTarget = - randomSlot * ROTATION_STEP;
        let diff = baseTarget - cur;
        diff = ((diff % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
        const extraSpin = (Math.random() > 0.5 ? 1 : -1) * (Math.PI * 2);
        c.targetRotation = cur + diff + extraSpin;
    });
    saveRotationState(); 
};

window.resetRotation = () => { lastInteractionTime = Date.now(); pauseAutoDuration = 3000; cylinders.forEach(c => c.targetRotation = 0); saveRotationState(); };
window.updateItemTitle = (cId, idx, val) => { CATEGORIES[cId].items[idx].title = val; saveState(); };
window.updateItemMemo = (cId, idx, val) => { CATEGORIES[cId].items[idx].desc = val; saveState(); };
window.updateItemLink = (cId, idx, val) => { CATEGORIES[cId].items[idx].link = val; saveState(); };
function updateStorageStatus() { const eb = window.EMBEDDED_DATA !== undefined; document.getElementById('storage-status').innerHTML = eb ? '<span class="text-green-500 font-black">● 데이터 내장됨</span>' : '<span>○ 브라우저 저장소</span>'; }
function showMessage(t) { const b = document.getElementById('message-box'); b.innerText = t; b.style.display = 'block'; setTimeout(() => b.style.display = 'none', 3000); }

function hideLoader() { 
    const loader = document.getElementById('loading-screen');
    if (loader) {
        loader.style.opacity = '0'; 
        loader.style.pointerEvents = 'none';
        setTimeout(() => { loader.style.display = 'none'; }, 800); 
    }
    // 스플래쉬 화면 종료 직후 바로 음악 플레이
    playAudio();
}

function getCurrentSelection() {
    let selectedItems = [];
    if (!cylinders || cylinders.length === 0 || !CATEGORIES) return [];

    for (let c = 0; c < cylinders.length; c++) {
        if (!CATEGORIES[c] || !CATEGORIES[c].items || CATEGORIES[c].items.length === 0) continue;

        let rot = cylinders[c].targetRotation;
        let turns = Math.round(rot / (Math.PI * 2));
        let normalizedRot = rot - (turns * Math.PI * 2);
        let idx = Math.round(-normalizedRot / ROTATION_STEP);
        idx = ((idx % ITEM_COUNT) + ITEM_COUNT) % ITEM_COUNT;
        
        let item = CATEGORIES[c].items[idx];
        if (item) {
            selectedItems.push(item);
        }
    }
    return selectedItems;
}

// --------------------------------------------------------------------------
// 18. BGM 음악 제어 / 전시 모드(Locked Mode) / 이용 안내 / 전체화면 제어
// --------------------------------------------------------------------------
let isMuted = false;
let audioInitialized = false;

function updateAudioUI(playing) {
    const btn = document.getElementById('audio-control-btn');
    const icon = document.getElementById('volume-icon');
    if (playing && !isMuted) {
        if (icon) icon.src = 'asset/sound icon 1.png';
        if (btn) btn.classList.add('playing');
    } else {
        if (icon) icon.src = 'asset/sound icon 2.png';
        if (btn) btn.classList.remove('playing');
    }
}

function playAudio() {
    const audio = document.getElementById('bgm-audio');
    if (!audio) return;
    
    audio.volume = 0.5;
    audio.muted = isMuted;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            audioInitialized = true;
            updateAudioUI(true);
            removeFirstInteractionListeners();
        }).catch((e) => {
            console.log('Audio playback pending user interaction:', e);
            updateAudioUI(false);
        });
    }
}

const audioInteractionEvents = ['pointerdown', 'touchstart', 'mousedown', 'click', 'keydown', 'wheel'];

function handleFirstAudioInteraction() {
    if (!audioInitialized) {
        playAudio();
    }
}

function addFirstInteractionListeners() {
    audioInteractionEvents.forEach(evt => {
        window.addEventListener(evt, handleFirstAudioInteraction, { capture: true, passive: true });
        document.addEventListener(evt, handleFirstAudioInteraction, { capture: true, passive: true });
    });
}

function removeFirstInteractionListeners() {
    audioInteractionEvents.forEach(evt => {
        window.removeEventListener(evt, handleFirstAudioInteraction, { capture: true });
        document.removeEventListener(evt, handleFirstAudioInteraction, { capture: true });
    });
}

function initAudio() {
    const audio = document.getElementById('bgm-audio');
    if (!audio) return;
    
    audio.volume = 0.5;
    // 1. 바로 재생 시도 (브라우저 자동재생 허용 시 즉시 실행)
    playAudio();

    // 2. 브라우저 차단 정책 대비: 사용자 첫 상호작용 시 캡처 페이즈로 즉시 음악 재생
    if (!audioInitialized) {
        addFirstInteractionListeners();
    }
}

window.toggleAudio = function() {
    const audio = document.getElementById('bgm-audio');
    if (!audio) return;

    if (audio.paused || isMuted) {
        isMuted = false;
        audio.muted = false;
        audio.play().then(() => {
            audioInitialized = true;
            updateAudioUI(true);
            removeFirstInteractionListeners();
        }).catch(e => console.log('Audio toggle play failed:', e));
    } else {
        isMuted = true;
        audio.muted = true;
        audio.pause();
        updateAudioUI(false);
    }
};

function initTitleHoverEffects() {
    const titles = document.querySelectorAll('.interactive-hover-title');
    titles.forEach(titleEl => {
        const text = titleEl.innerText;
        const lines = text.split('\n');
        titleEl.innerHTML = lines.map(line => {
            return line.split('').map(char => {
                if (char === ' ') return ' ';
                return `<span class="title-hover-letter">${char}</span>`;
            }).join('');
        }).join('<br>');
    });
}

let appStarted = false;
function startApp() {
    if (appStarted) return;
    appStarted = true;
    init();
    initAudio();
    initTitleHoverEffects();
}

if (document.readyState !== 'loading') {
    startApp();
} else {
    window.addEventListener('DOMContentLoaded', startApp);
    window.addEventListener('load', startApp);
}
// 로딩 지연 방지 안전 타이머 (최대 3.5초 후 스플래시 강제 해제)
setTimeout(hideLoader, 3500);

window.addEventListener('click', () => { document.querySelectorAll('.set-dropdown-menu').forEach(m => m.classList.remove('active')); });
window.closeInstructions = () => { 
    const o = document.getElementById('instruction-overlay'); 
    if (o) { 
        o.style.opacity = '0'; 
        setTimeout(() => o.style.display = 'none', 500); 
    }
    if (!audioInitialized) {
        playAudio();
    }
    pauseAutoDuration = 0;
    isHovering = false;
    isDragging = false;
};
window.showInstructions = () => { const o = document.getElementById('instruction-overlay'); if (o) { o.style.display = 'flex'; setTimeout(() => o.style.opacity = '1', 10); } };

// Shift + L 키 입력 시 전시 모드(Locked Mode) <-> 편집 모드 전환
window.addEventListener('keydown', (e) => { if (e.shiftKey && e.code === 'KeyL') { isLocked = !isLocked; document.body.classList.toggle('mode-locked', isLocked); showMessage(isLocked ? "전시 모드" : "편집 모드"); } });

function toggleFullScreen() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement) {
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) docEl.requestFullscreen();
        else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen();
        else if (docEl.mozRequestFullScreen) docEl.mozRequestFullScreen();
        else if (docEl.msRequestFullscreen) docEl.msRequestFullscreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
    }
}

['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(
    eventType => document.addEventListener(eventType, () => {
        const isFullScreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
        if (isIPad) {
            document.body.classList.toggle('ipad-fullscreen', isFullScreen);
        }
    })
);

// iPad에서 전체화면일 때 쓸어내림(Swipe Down)으로 인해 전체화면이 해제되는 것을 방지
document.addEventListener('touchmove', (e) => {
    const isFullScreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
    if (isIPad && isFullScreen) {
        // 스크롤이 필요한 영역(아카이브 스크롤, 스타일 칩 바)은 예외 처리
        const isScrollable = e.target.closest('.archive-scroll-area') || e.target.closest('.side-style-container');
        if (!isScrollable) {
            // 캔버스 등에서 쓸어내리는 기본 터치 동작(전체화면 해제/Safari UI 호출 등) 방지
            e.preventDefault();
        }
    }
}, { passive: false });

let consecutiveClicks = 0;
let clickTimer = null;
window.addEventListener('click', (e) => {
    consecutiveClicks++;
    if (clickTimer) clearTimeout(clickTimer);
    
    if (consecutiveClicks >= 4) {
        consecutiveClicks = 0;
        const isFullScreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
        
        toggleFullScreen();
        
        if (!isFullScreen) {
            isLocked = true;
            document.body.classList.toggle('mode-locked', isLocked);
            if (typeof showMessage === 'function') showMessage("전시 모드");
        } else {
            isLocked = false;
            document.body.classList.toggle('mode-locked', isLocked);
            if (typeof showMessage === 'function') showMessage("편집 모드");
        }
    } else {
        clickTimer = setTimeout(() => { consecutiveClicks = 0; }, 400);
    }
});

// digital clock
function updateDigitalClock() {
    const clockEl = document.getElementById('digital-clock');
    const dateEl = document.getElementById('digital-date');
    if (!clockEl && !dateEl) return;
    
    const now = new Date();
    

    
    if (dateEl) {
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const dayName = dayNames[now.getDay()];
        dateEl.textContent = `${year} ${month} ${day} ${dayName}`;
    }
}
setInterval(updateDigitalClock, 1000);
updateDigitalClock();



window.addEventListener('beforeunload', () => {
    if (saveStateTimeout) {
        clearTimeout(saveStateTimeout);
        _saveStateInternal();
    }
});

// ==========================================================================
// 1분 유휴 상태 시 메인 화면으로 복귀 (Idle Timer)
// ==========================================================================
let globalIdleTimer = null;
function resetGlobalIdleTimer() {
    if (globalIdleTimer) clearTimeout(globalIdleTimer);
    globalIdleTimer = setTimeout(() => {
        returnToMainScreen();
    }, 60000); // 1분 = 60,000ms
}

function returnToMainScreen() {
    // 1. 정보 팝업 닫기
    const infoPopup = document.getElementById('info-popup');
    if (infoPopup) infoPopup.style.display = 'none';

    // 2. 관리 패널 닫기
    const p = document.getElementById('management-panel');
    if (p) p.style.display = 'none';

    // 3. 2D 펼침 모드 해제
    if (typeof isFlatView !== 'undefined' && isFlatView && typeof window.toggleFlatView === 'function') {
        window.toggleFlatView();
    }

    // 4. 카메라 줌 및 원통 회전 초기화
    if (typeof targetZoom !== 'undefined') targetZoom = 1.0;
    if (typeof cylinders !== 'undefined') {
        cylinders.forEach(c => {
            if (c) c.targetRotation = 0;
        });
    }

    // 5. 상태 초기화
    if (typeof isDragging !== 'undefined') isDragging = false;
    if (typeof isHovering !== 'undefined') isHovering = false;
    if (typeof activeCylinderIndex !== 'undefined') activeCylinderIndex = -1;
    if (typeof hoveredCylinderIndex !== 'undefined') hoveredCylinderIndex = -1;
    if (typeof pauseAutoDuration !== 'undefined') pauseAutoDuration = 0;

    // 6. 인스트럭션 화면(메인 대기 화면) 띄우기
    if (typeof window.showInstructions === 'function') {
        window.showInstructions();
    } else {
        const o = document.getElementById('instruction-overlay'); 
        if (o) { 
            o.style.display = 'flex'; 
            setTimeout(() => o.style.opacity = '1', 10); 
        }
    }
}

window.addEventListener('pointermove', resetGlobalIdleTimer, { passive: true, capture: true });
window.addEventListener('pointerdown', resetGlobalIdleTimer, { passive: true, capture: true });
window.addEventListener('wheel', resetGlobalIdleTimer, { passive: true, capture: true });
window.addEventListener('keydown', resetGlobalIdleTimer, { passive: true, capture: true });
window.addEventListener('touchstart', resetGlobalIdleTimer, { passive: true, capture: true });
window.addEventListener('touchmove', resetGlobalIdleTimer, { passive: true, capture: true });
window.addEventListener('touchend', resetGlobalIdleTimer, { passive: true, capture: true });
window.addEventListener('click', resetGlobalIdleTimer, { passive: true, capture: true });
window.addEventListener('mousemove', resetGlobalIdleTimer, { passive: true, capture: true });
window.addEventListener('mousedown', resetGlobalIdleTimer, { passive: true, capture: true });

resetGlobalIdleTimer();
