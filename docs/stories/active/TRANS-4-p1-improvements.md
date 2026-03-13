# TRANS-4: Melhorias P1 no pipeline de transcrição

**Status:** Ready for Review
**Priority:** P1 (High)
**Effort:** 4h
**Sprint:** Transcription Quality Sprint (post-P0)
**Source:** Análise 2026-03-13 (kaizen + pedro-valerio)
**Blocked By:** TRANS-1, TRANS-2

---

## Context

Melhorias de segundo nível identificadas pelos 3 especialistas. Dependem dos P0 estarem resolvidos.

## Acceptance Criteria

- [x] **AC-1: Retry com jitter** — Adicionar random jitter ao backoff para evitar thundering herd
  - Arquivos: `youtube_captions.py`, `deepgram_engine.py`
  - Formula: `wait + random.uniform(0, 0.3 * wait)`

- [x] **AC-2: Timeout em yt-dlp** — Adicionar `socket_timeout: 30` nas opções do yt-dlp
  - Arquivo: `youtube_captions.py`
  - Previne travamento em vídeos privados/removidos

- [x] **AC-3: Skip compressão se já otimizado** — Detectar formato/bitrate antes de comprimir
  - Arquivo: `lib/audio.py`
  - Nova função `is_already_optimized()` + early return em `compress_audio()`

- [x] **AC-4: Playlist resume** — Usar TranscriptionState para playlists (não só batch)
  - Arquivo: `youtube_captions.py`
  - Lazy-load `_get_state_class()` + skip/mark_completed/mark_failed

- [x] **AC-5: Search API quota graceful** — Salvar INDEX.md parcial antes de parar em quota exceeded
  - Arquivo: `youtube_captions.py`
  - `sys.exit(1)` → `break` (resultados parciais salvos)
  - KeyboardInterrupt handler em Phase 3

- [x] **AC-6: Structured logging** — Trocar print() por logging module com níveis
  - audio.py, deepgram_engine.py, splitter.py, aios_transcriber.py
  - Formato: `%(asctime)s [%(levelname)s] [%(name)s] %(message)s`

- [x] **AC-7: Integrar splitter.py no fluxo** — Conectar auto-split ao deepgram_engine
  - Arquivo: `lib/deepgram_engine.py`
  - Auto-detect > 2GB → split em chunks → transcribe sequencial → join

## File List

| File | Action | Description |
|------|--------|-------------|
| `tools/youtube-captions/youtube_captions.py` | MODIFY | Jitter, timeout, playlist resume, quota graceful |
| `tools/aios-transcriber/lib/audio.py` | MODIFY | Skip compressão + structured logging |
| `tools/aios-transcriber/lib/deepgram_engine.py` | MODIFY | Jitter, splitter integration, logging |
| `tools/aios-transcriber/lib/splitter.py` | MODIFY | Structured logging |
| `tools/aios-transcriber/aios_transcriber.py` | MODIFY | Structured logging config |
| `tools/aios-transcriber/tests/test_deepgram_engine.py` | MODIFY | Ajuste mocks para splitter + jitter |

## Definition of Done

- [x] Retry tem jitter visível nos logs
- [x] yt-dlp timeout em vídeo privado < 30s
- [x] Arquivo MP3 16kHz mono skip compressão (log: "Already optimized, skipping compression")
- [x] Playlist interrompida retoma de onde parou
- [x] API quota exceeded salva INDEX.md parcial
- [x] Logs em formato estruturado com níveis
- [x] Arquivo >24MB é splitado automaticamente antes do Deepgram

## Execution Summary (2026-03-13)

| AC | Commit | Agente |
|----|--------|--------|
| AC-1 (jitter) | 13c01d354 | dev-agent-1 |
| AC-2 (timeout) | 13c01d354 | dev-agent-1 |
| AC-3 (skip compress) | 13c01d354 | dev-agent-1 |
| AC-4 (playlist resume) | 13c01d354 | dev-agent-2 |
| AC-5 (quota graceful) | 13c01d354 | dev-agent-2 |
| AC-6 (structured logging) | 13c01d354 | dev-agent-3 |
| AC-7 (splitter integration) | 13c01d354 | dev-agent-3 |

### Testes
- 96 aios-transcriber tests: PASS
- 20 youtube-captions tests: PASS
- **116 total, 0 failures**
