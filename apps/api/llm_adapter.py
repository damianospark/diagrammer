# apps/api/llm_adapter.py
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import httpx
import logging
import os
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

class LLMAdapter(ABC):
    """LLM 어댑터 추상 베이스 클래스"""

    @abstractmethod
    async def generate_diagram_code(self, prompt: str, engine: str = 'mermaid') -> Dict[str, Any]:
        """프롬프트로부터 다이어그램 코드 생성"""
        pass


class MockLLMAdapter(LLMAdapter):
    """개발용 Mock LLM 어댑터"""

    async def generate_diagram_code(self, prompt: str, engine: str = 'mermaid') -> Dict[str, Any]:
        """Mock 다이어그램 코드 생성"""
        logger.info(f"🎭 Mock LLM: Generating {engine} code")
        logger.info(f"   - Prompt length: {len(prompt)} characters")
        logger.info(f"   - Prompt preview: {prompt[:100]}{'...' if len(prompt) > 100 else ''}")

        if engine == 'mermaid':
            mock_code = """graph TD
    A[사용자 프롬프트] --> B(LLM 분석)
    B --> C{다이어그램 타입}
    C -->|플로우차트| D[플로우차트 생성]
    C -->|시퀀스| E[시퀀스 다이어그램 생성]
    C -->|기타| F[범용 다이어그램 생성]
    D --> G[코드 반환]
    E --> G
    F --> G"""
            logger.info(f"✅ Mock generated Mermaid code ({len(mock_code)} characters)")
        elif engine == 'visjs':
            mock_code = """{
  "nodes": [
    {"id": 1, "label": "사용자 프롬프트", "x": -100, "y": -100},
    {"id": 2, "label": "LLM 분석", "x": 0, "y": 0},
    {"id": 3, "label": "다이어그램 생성", "x": 100, "y": 100}
  ],
  "edges": [
    {"from": 1, "to": 2},
    {"from": 2, "to": 3}
  ]
}"""
            logger.info(f"✅ Mock generated Vis.js code ({len(mock_code)} characters)")
        else:
            mock_code = f"// {engine} 엔진으로 생성된 다이어그램\n// 프롬프트: {prompt}"
            logger.info(f"✅ Mock generated generic code ({len(mock_code)} characters)")

        logger.info(f"📊 Mock code preview: {mock_code[:100]}{'...' if len(mock_code) > 100 else ''}")

        return {
            "success": True,
            "engine": engine,
            "code": mock_code,
            "metadata": {
                "provider": "mock",
                "processing_time": 0.1,
                "node_count": 5
            }
        }


class GeminiAdapter(LLMAdapter):
    """Google Gemini API 어댑터"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"
        # 최신 모델 우선 순위로 시도, 미존재(404) 시 다음 모델로 폴백
        self.candidate_models = [
            "gemini-2.5-flash",
            "gemini-2.5-pro"
        ]
        self.model = self.candidate_models[0]  # 로그용 기본 모델 이름

    async def generate_diagram_code(self, prompt: str, engine: str = 'mermaid') -> Dict[str, Any]:
        """Gemini API를 사용한 다이어그램 코드 생성"""
        logger.info("🚀 GeminiAdapter.generate_diagram_code called")
        logger.info(f"   - Prompt length: {len(prompt)} characters")
        logger.info(f"   - Engine: {engine}")
        logger.info(f"   - Has API key: {bool(self.api_key)}")

        if not self.api_key:
            logger.warning("❌ Gemini API key not found, falling back to mock")
            mock_adapter = MockLLMAdapter()
            return await mock_adapter.generate_diagram_code(prompt, engine)

        try:
            last_error: Optional[str] = None

            for model_name in self.candidate_models:
                url = f"{self.base_url}/models/{model_name}:generateContent?key={self.api_key}"
                logger.info(f"🌐 Trying model: {model_name}")
                logger.info(f"🌐 API URL: {url.replace(self.api_key, '[API_KEY]')}")

                system_prompt = f"""
### # ROLE

당신은 사용자의 요청을 분석하여 최적의 다이어그램을 생성하는 **지능형 다이어그램 에이전트**입니다. 당신의 임무는 요청의 복잡성과 유형을 판단하여 **Mermaid.js** 또는 **Viz.js(DOT 언어)** 중 가장 적합한 도구를 선택하고, 해당 도구의 문법에 맞춰 완벽한 코드를 생성하는 것입니다.

---

### # WORKFLOW (작업 흐름) 🧠

1.  **요청 분석**: 사용자의 요청이 **단순한 프로세스/흐름**인지, 아니면 **복잡한 네트워크/구조**인지 먼저 분석합니다.
2.  **도구 선택**: 아래의 **[도구 선택 가이드라인]**에 따라 Mermaid.js와 Viz.js 중 하나를 선택합니다. **Mermaid 사용을 최우선으로 고려**하되, Mermaid로 표현하기 부적절할 때만 Viz.js를 사용합니다.
3.  **코드 생성**: 선택한 도구의 **[규칙]**을 엄격하게 준수하여 코드를 생성합니다. 최종 결과물은 **코드 블록만** 출력해야 합니다.

---

### # TOOL SELECTION GUIDELINES (도구 선택 가이드라인) ⚙️

#### ✅ Mermaid.js (기본 도구)를 선택하는 경우:

* **플로우 차트, 시퀀스 다이어그램, 간트 차트, 클래스 다이어그램** 등 표준적인 다이어그램을 요청할 때.
* 노드의 개수가 적고 관계가 비교적 단순하여 **수동으로 레이아웃을 제어**하는 것이 더 나을 때.
* 사용자의 요청이 명확한 **순서나 절차**를 가지고 있을 때.

#### ✅ Viz.js (대체 도구)를 선택하는 경우:

* 사용자가 **"시스템 아키텍처", "네트워크 토폴로지", "의존성 그래프", "복잡한 관계도"** 등 명시적으로 복잡한 다이어그램을 요청할 때.
* 관계의 **연결성(Connectivity)**이 순서보다 더 중요할 때.
* 전역 속성을 먼저 정의하여 일관성을 유지하세요. 예: `rankdir=TB; node [shape=box];`

---
### # RULES (규칙)

#### 1. Mermaid.js 규칙 (기본)

* 다이어그램 방향은 위에서 아래(`graph TD`)여야 합니다.
* 모든 사각형 텍스트 노드는 `["텍스트"]` 형태를 사용합니다. 예: `A["사용자 요청 처리"]`
* 결정/조건 노드는 중괄호 `{{}}`를 사용합니다. 예: `B{{조건 충족?}}`
* 노드 ID는 고유해야 합니다.

#### 2. Viz.js (DOT Language) 규칙 (대체)

* 코드는 `digraph G { ... }` 블록으로 감싸야 합니다.
* 각 라인은 세미콜론 `;`으로 마무리합니다.
* 공백이 포함된 라벨은 큰따옴표로 감쌉니다. 예: `node1 [label="데이터베이스 서버"];`
* 방향성 있는 엣지는 `->`를 사용합니다.

### # REQUEST

 {prompt}"""

                logger.info(f"📝 System prompt length: {len(system_prompt)} characters")
                logger.info(f"📝 User prompt: {prompt}")

                payload = {
                    "contents": [
                        {
                            "role": "user",
                            "parts": [{"text": system_prompt}],
                        }
                    ],
                    "generationConfig": {
                        "temperature": 0.3,
                        "maxOutputTokens": 2048,
                    },
                }

                logger.info("📡 Sending request to Gemini API...")
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(url, json=payload)

                logger.info(f"📡 Response status: {response.status_code}")
                logger.info(f"📡 Response headers: {dict(response.headers)}")

                if response.status_code == 200:
                    result = response.json()
                    try:
                        logger.info(f"📦 Raw API response keys: {list(result.keys())}")
                    except Exception:
                        pass

                    candidates = result.get("candidates") or []
                    if not candidates:
                        last_error = "No candidates in API response"
                        logger.warning(f"❌ {last_error}: {result}")
                        # Try next candidate model
                        continue

                    cand0 = candidates[0] or {}
                    generated_text = ""

                    try:
                        content = cand0.get("content") or {}
                        parts = content.get("parts")
                        if isinstance(parts, list) and parts:
                            first_part = parts[0] or {}
                            generated_text = first_part.get("text") or ""
                    except Exception:
                        # fallthrough to other shapes
                        pass

                    if not generated_text:
                        # other possible shapes seen in some responses
                        generated_text = (
                            cand0.get("text")
                            or result.get("text")
                            or ("\n".join(cand0.get("output", [])) if isinstance(cand0.get("output"), list) else cand0.get("output", ""))
                        )

                    if not generated_text:
                        last_error = "No text content in candidates"
                        logger.warning(f"❌ {last_error}: {cand0}")
                        # Try next candidate model
                        continue

                    try:
                        logger.info(f"📝 Generated text length: {len(generated_text)} characters")
                        logger.info(
                            f"📝 Generated text preview: {generated_text[:200]}{'...' if len(generated_text) > 200 else ''}"
                        )
                    except Exception:
                        pass

                    # 코드 블록에서 순수 코드 추출
                    logger.info(f"🔍 Looking for {engine} code blocks in response...")
                    if f'```{engine}' in generated_text:
                        code = generated_text.split(f'```{engine}')[1].split('```')[0].strip()
                        logger.info(f"✅ Found {engine} code block, extracted {len(code)} characters")
                    else:
                        code = generated_text.strip()
                        logger.info(f"⚠️ No {engine} code block found, using raw text ({len(code)} characters)")

                    logger.info(f"📊 Final code preview: {code[:100]}{'...' if len(code) > 100 else ''}")

                    # 간단한 형식 검증: 부적합 시 친절한 오류로 반환하여 프론트가 안내 버블을 생성할 수 있게 함
                    def looks_like_mermaid(s: str) -> bool:
                        tokens = [
                            'graph ', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram',
                            'erDiagram', 'gantt', 'journey', 'pie'
                        ]
                        return any(tok in s for tok in tokens)

                    def looks_like_visjs_json(s: str) -> bool:
                        try:
                            obj = __import__('json').loads(s)
                            return isinstance(obj, dict) and ('nodes' in obj or 'edges' in obj)
                        except Exception:
                            return False

                    if engine == 'mermaid' and not looks_like_mermaid(code):
                        return {
                            'success': False,
                            'error': "No diagram code detected for Mermaid. Please provide or request a Mermaid flowchart/sequence/class/state diagram code.",
                            'engine': engine,
                        }
                    if engine == 'visjs' and not looks_like_visjs_json(code):
                        return {
                            'success': False,
                            'error': "No valid vis.js JSON detected. Please request a vis.js JSON with 'nodes' and 'edges'.",
                            'engine': engine,
                        }

                    # 최종 성공 반환 (사용된 모델 기록)
                    self.model = model_name
                    return {
                        "success": True,
                        "engine": engine,
                        "code": code,
                        "metadata": {
                            "provider": "gemini",
                            "model": model_name,
                            "raw_response": generated_text,
                            "response_tokens": len(generated_text.split())
                        }
                    }

                # 비정상 상태 코드 처리
                logger.error(f"❌ Gemini API error with model {model_name}: {response.status_code}")
                logger.error(f"❌ Response text: {response.text}")

                if response.status_code == 404:
                    # 404면 다음 후보 모델로 폴백
                    logger.warning("⚠️ Model not found, trying next candidate model...")
                    continue
                else:
                    # 404 외 오류도 다음 모델 시도
                    last_error = f"API error: {response.status_code}"
                    logger.warning(last_error)
                    continue

            # 모든 모델이 실패한 경우: Mock으로 폴백
            logger.warning(f"⚠️ All candidate models failed. Falling back to Mock. last_error={last_error}")
            mock_adapter = MockLLMAdapter()
            return await mock_adapter.generate_diagram_code(prompt, engine)

        except Exception as e:
            logger.error(f"💥 Gemini API error: {str(e)}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "engine": engine
            }


def get_llm_adapter(provider: str = 'mock') -> LLMAdapter:
    """LLM 어댑터 생성"""
    adapters = {
        'mock': MockLLMAdapter,
        'gemini': GeminiAdapter,
    }
    if provider not in adapters:
        logger.warning(f"Unknown provider {provider}, using mock")
        return MockLLMAdapter()
    return adapters[provider]()