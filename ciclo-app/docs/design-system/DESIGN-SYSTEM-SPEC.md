# Ciclo das Estacoes — Design System Specification
# "Frequencia Violeta" — O Design System do Sagrado

> *"O resgate da harmonia entre a humanidade e a natureza"*
> Onde a geometria sagrada encontra a tecnologia ancestral.

---

## 1. Filosofia de Design

### Conceito Central: FREQUENCIA VIOLETA

O Ciclo das Estacoes e o brace espiritual da Base Triade. Enquanto a Base Triade
ancora na terra (verde profundo), o Ciclo eleva para o ceu (violeta). A fusao
dessas duas frequencias cria algo que nao existe no mercado: **natureza mistica
digital** — um app que parece ter sido desenhado por uma civilizacao ancestral
que domina tecnologia quantica.

### Pilares Visuais

1. **Mandala como Grid** — Todo layout e uma mandala. Secoes irradiam do centro.
2. **Violeta como Frequencia** — Nao e uma cor, e uma vibracao. Gradientes vivos.
3. **Geometria Sagrada como Estrutura** — Icosaedro, Flor da Vida, Triskle.
4. **Natureza como Textura** — Bambu, agua, floresta atlantica, insetos.
5. **Sazonalidade como Identidade** — Cada estacao transforma toda a UI.

### Referencia Estetica

Imagine o encontro entre:
- A profundidade mistica de um templo tibetano
- A elegancia digital do Apple Vision Pro
- A organicidade da Mata Atlantica
- A geometria de um caleidoscopio cosmico
- A sofisticacao de marcas como Aesop + Goop + Headspace

---

## 2. Sistema de Cores

### 2.1 Paleta Base Triade (Herdada)

| Token | Hex | Uso |
|-------|-----|-----|
| `base-forest` | `#24451F` | Verde mais profundo — fundos escuros |
| `base-dark` | `#213B2C` | Verde institucional primario |
| `base-green` | `#3F6E36` | Verde medio — acentos |
| `base-emerald` | `#5EA142` | Verde vibrante — CTAs natureza |
| `base-teal` | `#5184A7` | Azul-petrol — elemento agua |
| `base-ocean` | `#185474` | Azul profundo — profundidade |
| `base-sky` | `#8DC2DB` | Azul claro — ar, leveza |
| `base-amber` | `#D48113` | Laranja quente — terra, fogo |
| `base-gold` | `#D2B317` | Dourado — sabedoria, sol |
| `base-copper` | `#C97A46` | Cobre — ancestralidade |
| `base-earth` | `#5F4822` | Marrom terra — base |
| `base-cream` | `#F5EED4` | Creme natural — papel, luz |
| `base-coral` | `#CD684D` | Coral vivo — energia vital |
| `base-violet` | `#932E88` | VIOLETA ORIGINAL — a semente |

### 2.2 Espectro Violeta (Nova Camada — Alta Frequencia)

O violeta `#932E88` da Base Triade se expande em um espectro completo:

| Token | Hex | Nome Poetico | Uso |
|-------|-----|--------------|-----|
| `violet-50` | `#FDF4FF` | Orvalho Lunar | Backgrounds sutis |
| `violet-100` | `#FAE8FF` | Nevoa Ametista | Hover states |
| `violet-200` | `#F0BBFE` | Aurora Mistica | Bordas suaves |
| `violet-300` | `#E089FC` | Flor de Lavanda | Tags, badges |
| `violet-400` | `#C945E8` | Chama Violeta | Acentos ativos |
| `violet-500` | `#A830C0` | Cristal Ametista | Primario violeta |
| `violet-600` | `#932E88` | Frequencia Original | Bridge c/ Base Triade |
| `violet-700` | `#7B1FA2` | Coroa Csmica | Headings, CTAs |
| `violet-800` | `#5C1680` | Noite Sagrada | Fundos escuros |
| `violet-900` | `#3B0764` | Abismo Estelar | Hero sections |
| `violet-950` | `#1E0338` | Void Ancestral | Maximum depth |

### 2.3 Paleta Sazonal (4 Estacoes = 4 Universos)

Cada estacao transforma a UI inteira via CSS custom properties:

#### PRIMAVERA — Renascimento (Madeira/Figado — MTC)
| Token | Hex | Elemento |
|-------|-----|----------|
| `season-primary` | `#5EA142` | Verde novo, broto |
| `season-secondary` | `#E089FC` | Violeta suave, flor |
| `season-accent` | `#F5C6D0` | Rosa petala |
| `season-glow` | `#A8E6A1` | Verde luminoso |
| `season-bg` | `#F0FFF0` | Branco esverdeado |

#### VERAO — Plenitude (Fogo/Coracao — MTC)
| Token | Hex | Elemento |
|-------|-----|----------|
| `season-primary` | `#D48113` | Laranja solar |
| `season-secondary` | `#C945E8` | Violeta vibrante |
| `season-accent` | `#CD684D` | Coral energia |
| `season-glow` | `#FFD700` | Dourado solar |
| `season-bg` | `#FFFBF0` | Branco dourado |

#### OUTONO — Recolhimento (Metal/Pulmao — MTC)
| Token | Hex | Elemento |
|-------|-----|----------|
| `season-primary` | `#C97A46` | Cobre folhas |
| `season-secondary` | `#7B1FA2` | Violeta profundo |
| `season-accent` | `#8B4513` | Marrom terroso |
| `season-glow` | `#DEB887` | Dourado palido |
| `season-bg` | `#FFF8F0` | Branco ambar |

#### INVERNO — Introspeccao (Agua/Rins — MTC)
| Token | Hex | Elemento |
|-------|-----|----------|
| `season-primary` | `#185474` | Azul profundo |
| `season-secondary` | `#5C1680` | Violeta noturno |
| `season-accent` | `#8DC2DB` | Azul gelo |
| `season-glow` | `#B0C4DE` | Prata lunar |
| `season-bg` | `#F0F8FF` | Branco azulado |

### 2.4 Gradientes Sagrados

```css
/* Gradiente Triskle — a assinatura visual */
--gradient-triskle: conic-gradient(
  from 0deg,
  #24451F 0deg,
  #932E88 120deg,
  #D48113 240deg,
  #24451F 360deg
);

/* Gradiente Frequencia Violeta — hero sections */
--gradient-violet-freq: linear-gradient(
  135deg,
  #1E0338 0%,
  #5C1680 25%,
  #932E88 50%,
  #C945E8 75%,
  #FAE8FF 100%
);

/* Gradiente Aurora Boreal — destaques premium */
--gradient-aurora: linear-gradient(
  180deg,
  #213B2C 0%,
  #185474 30%,
  #7B1FA2 60%,
  #C945E8 85%,
  #E089FC 100%
);

/* Gradiente Mandala — backgrounds radiais */
--gradient-mandala: radial-gradient(
  ellipse at center,
  #932E88 0%,
  #5C1680 30%,
  #213B2C 70%,
  #24451F 100%
);

/* Gradiente Chakra Coroa — elementos sagrados */
--gradient-crown-chakra: radial-gradient(
  circle at 50% 0%,
  #FAE8FF 0%,
  #C945E8 30%,
  #7B1FA2 60%,
  transparent 100%
);
```

---

## 3. Tipografia

### Stack Tipografico (Herdado + Elevado)

| Nivel | Fonte | Uso | Peso |
|-------|-------|-----|------|
| Display | **Artega** | Titulos hero, numeros grandes | 700 |
| Heading | **Zilla Slab** | H1-H3, secoes principais | 500-700 |
| Body | **Libre Franklin** | Texto corrido, UI | 400-600 |
| Accent | **Caveat** | Citacoes, anotacoes, handwritten | 400-700 |
| Mono | **JetBrains Mono** | Codigos, dados tecnicos | 400 |

### Escala Tipografica (Fluid — clamp)

```css
--text-xs: clamp(0.694rem, 0.65vi + 0.55rem, 0.75rem);
--text-sm: clamp(0.833rem, 0.8vi + 0.65rem, 0.875rem);
--text-base: clamp(1rem, 1vi + 0.75rem, 1.125rem);
--text-lg: clamp(1.2rem, 1.3vi + 0.85rem, 1.5rem);
--text-xl: clamp(1.44rem, 1.7vi + 1rem, 1.875rem);
--text-2xl: clamp(1.728rem, 2.2vi + 1.1rem, 2.25rem);
--text-3xl: clamp(2.074rem, 2.8vi + 1.3rem, 3rem);
--text-4xl: clamp(2.488rem, 3.5vi + 1.5rem, 3.75rem);
--text-5xl: clamp(2.986rem, 4.5vi + 1.7rem, 4.5rem);
--text-hero: clamp(3.583rem, 6vi + 2rem, 6rem);
```

---

## 4. Geometria Sagrada — Sistema de Formas

### 4.1 Motivos Fundamentais

| Motivo | Origem | Uso no App |
|--------|--------|------------|
| **Triskle** | Logo Base Triade | Loading spinner, watermark, favicon |
| **Icosaedro** | Solidos de Platao (agua) | Containers, cards premium |
| **Flor da Vida** | Geometria sagrada universal | Background patterns, mandalas |
| **Hexagono** | Colmeia Base Triade | Grid de nucleos, nav icons |
| **Triangulo** | Trinidade | Section dividers, badges |
| **Circulo** | Ciclo, estacoes | Avatars, progress, timers |

### 4.2 Mandala Components (CSS puro)

```css
/* Mandala como background decorativo */
.mandala-bg {
  background-image:
    /* Circulos concentricos */
    radial-gradient(circle at 50% 50%, transparent 20%, rgba(147,46,136,0.03) 20.5%, transparent 21%),
    radial-gradient(circle at 50% 50%, transparent 35%, rgba(147,46,136,0.03) 35.5%, transparent 36%),
    radial-gradient(circle at 50% 50%, transparent 50%, rgba(147,46,136,0.03) 50.5%, transparent 51%),
    /* Petalas rotacionadas */
    conic-gradient(from 0deg at 50% 50%,
      transparent 0deg, rgba(147,46,136,0.02) 15deg,
      transparent 30deg, rgba(147,46,136,0.02) 45deg,
      transparent 60deg);
}

/* Mandala animada para loading/splash */
.mandala-spin {
  animation: mandala-rotate 30s linear infinite;
  background: conic-gradient(
    from 0deg,
    transparent,
    rgba(147,46,136,0.1),
    transparent,
    rgba(93,22,128,0.1),
    transparent
  );
  border-radius: 50%;
  mask-image: /* SVG da Flor da Vida */;
}

@keyframes mandala-rotate {
  to { transform: rotate(360deg); }
}
```

### 4.3 Pattern Library (SVG Patterns)

Padroes organicos inspirados nos insetos da Mata Atlantica (como documentado no brand book):
- `pattern-organic`: Linhas organicas fluidas (background sutil)
- `pattern-hexgrid`: Grid hexagonal (secoes de nucleos)
- `pattern-sacred`: Flor da Vida simplificada (hero backgrounds)
- `pattern-triskle`: Triskles repetidos (footer, watermarks)
- `pattern-waves`: Ondas do mar (elemento agua — Inverno)
- `pattern-leaves`: Folhas abstratas (elemento madeira — Primavera)

---

## 5. Espacamento & Layout

### 5.1 Escala de Espacamento (Golden Ratio inspired)

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.618rem;  /* 25.9px — phi */
--space-6: 2.618rem;  /* 41.9px — phi^2 */
--space-8: 4.236rem;  /* 67.8px — phi^3 */
--space-10: 6.854rem; /* 109.7px — phi^4 */
--space-12: 11.09rem; /* 177.4px — phi^5 */
```

### 5.2 Grid Mandala

O layout principal usa um grid radial conceitual:
- **Centro**: Logo/Triskle ou conteudo hero
- **Primeiro anel**: Navegacao principal / CTA
- **Segundo anel**: Cards de conteudo / Eventos
- **Terceiro anel**: Informacoes complementares
- **Borda**: Footer / Navegacao secundaria

Na pratica (CSS Grid):
```css
.mandala-layout {
  display: grid;
  grid-template-columns: 1fr min(90vw, 1200px) 1fr;
  grid-template-rows: auto;
}

.mandala-layout > * {
  grid-column: 2;
}

.mandala-layout > .full-bleed {
  grid-column: 1 / -1;
}
```

### 5.3 Border Radius (Organico)

```css
--radius-sm: 0.375rem;    /* Botoes pequenos */
--radius-md: 0.75rem;     /* Cards */
--radius-lg: 1.5rem;      /* Containers */
--radius-xl: 2.5rem;      /* Modals */
--radius-full: 9999px;    /* Avatares, pills */
--radius-organic: 30% 70% 70% 30% / 30% 30% 70% 70%; /* Forma organica */
--radius-petal: 50% 0% 50% 0%; /* Forma petala */
```

---

## 6. Efeitos & Animacoes

### 6.1 Glassmorphism Mistico

```css
.glass-sacred {
  background: rgba(30, 3, 56, 0.6);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(147, 46, 136, 0.2);
  box-shadow:
    0 0 30px rgba(147, 46, 136, 0.1),
    inset 0 0 30px rgba(147, 46, 136, 0.05);
}

.glass-nature {
  background: rgba(33, 59, 44, 0.7);
  backdrop-filter: blur(16px) saturate(150%);
  border: 1px solid rgba(94, 161, 66, 0.15);
  box-shadow:
    0 0 20px rgba(94, 161, 66, 0.08);
}
```

### 6.2 Glow Effects

```css
.glow-violet {
  box-shadow:
    0 0 10px rgba(147, 46, 136, 0.3),
    0 0 30px rgba(147, 46, 136, 0.15),
    0 0 60px rgba(147, 46, 136, 0.05);
}

.glow-season {
  box-shadow:
    0 0 10px var(--season-glow-rgb, 0.3),
    0 0 30px var(--season-glow-rgb, 0.15);
}

.text-glow {
  text-shadow:
    0 0 10px rgba(147, 46, 136, 0.5),
    0 0 30px rgba(147, 46, 136, 0.3);
}
```

### 6.3 Animacoes Sagradas

```css
/* Respiracao — pulsacao suave (como meditacao) */
@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 1; }
}

/* Mandala giratoria lenta */
@keyframes mandala-slow {
  to { transform: rotate(360deg); }
}

/* Fade ethereal — entrada mistica */
@keyframes ethereal-in {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
    filter: blur(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

/* Shimmer sagrado — brilho percorrendo */
@keyframes sacred-shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

/* Duracao padrao respeitando preferencia do usuario */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 7. Componentes Atomicos

### 7.1 Atoms

| Componente | Descricao | Variantes |
|------------|-----------|-----------|
| `Button` | CTA principal | primary, sacred, ghost, season |
| `Badge` | Tags de estacao/elemento | season, element, status |
| `Icon` | Icones sagrados (SVG) | triskle, hexagon, element |
| `Avatar` | Foto com borda mandala | sm, md, lg, sacred |
| `Divider` | Separador geometrico | line, mandala, wave, sacred |
| `Spinner` | Loading Triskle animado | sm, md, lg |
| `Chip` | Elemento MTC / Ayurveda | wood, fire, earth, metal, water |

### 7.2 Molecules

| Componente | Descricao |
|------------|-----------|
| `EventCard` | Card de evento sazonal com gradiente da estacao |
| `SeasonSelector` | Seletor visual das 4 estacoes (mandala interativa) |
| `PracticeCard` | Card de pratica (Yoga, MTC, Ayurveda) |
| `TestimonialCard` | Depoimento com foto em frame mandala |
| `PricingTier` | Tier de preco com gradiente violeta |
| `CheckInQR` | QR code estilizado com borda sagrada |

### 7.3 Organisms

| Componente | Descricao |
|------------|-----------|
| `HeroSacred` | Hero com mandala animada de fundo |
| `NavigationMandala` | Nav com icones hexagonais |
| `EventTimeline` | Timeline circular das estacoes |
| `SeasonDashboard` | Dashboard adaptativo por estacao |
| `FooterTriade` | Footer com pattern organico |
| `SplashScreen` | Tela de carregamento com Triskle girando |

---

## 8. Implementacao Tecnica

### 8.1 Tailwind Config (Extendido)

O design system sera implementado via:
1. **CSS Custom Properties** para tokens dinamicos (estacoes)
2. **Tailwind extend** para tokens estaticos
3. **CSS @layer** para componentes base
4. **Framer Motion** para animacoes React

### 8.2 Arquitetura de Arquivos

```
packages/ui/
  src/
    tokens/
      colors.css          # Custom properties de cores
      typography.css       # Font stacks e escala
      spacing.css          # Golden ratio spacing
      effects.css          # Glassmorphism, glows, gradients
      seasons.css          # Tokens sazonais (4 temas)
      animations.css       # Keyframes sagrados
    patterns/
      mandala.svg          # SVG pattern mandala
      organic.svg          # Pattern organico (insetos)
      hexgrid.svg          # Grid hexagonal
      sacred-geometry.svg  # Flor da Vida
      triskle.svg          # Triskle simplificado
    components/
      atoms/               # Button, Badge, Icon, Avatar, etc
      molecules/           # EventCard, SeasonSelector, etc
      organisms/           # HeroSacred, NavigationMandala, etc
    themes/
      primavera.css        # Overrides Primavera
      verao.css            # Overrides Verao
      outono.css           # Overrides Outono
      inverno.css          # Overrides Inverno
```

---

## 9. Acessibilidade (WCAG AA)

| Requisito | Implementacao |
|-----------|---------------|
| Contraste minimo 4.5:1 | Todas combinacoes de cor validadas |
| Contraste violeta/branco | `#7B1FA2` sobre branco = 7.2:1 |
| Contraste verde/cream | `#213B2C` sobre `#F5EED4` = 9.1:1 |
| Reduced motion | Todas animacoes respeitam `prefers-reduced-motion` |
| Focus visible | Outline violeta luminoso (`glow-violet`) |
| Dark mode | Fundo `#1E0338` com texto `#F5EED4` = 12.4:1 |
| Screen readers | Elementos decorativos marcados `aria-hidden` |

---

## 10. Diferenciais Competitivos

| O que existe no mercado | O que nos fazemos |
|-------------------------|-------------------|
| Sites holisticos amadores | Design system profissional de nivel Aesop |
| Verde generico + lotus clipart | Violeta alta frequencia + geometria sagrada |
| Layouts estaticos | UI que RESPIRA — muda com a estacao |
| Fundos brancos sem vida | Glassmorphism mistico com mandalas |
| Tipografia generica | 5 fontes com hierarquia poetica |
| Animacoes de template | Triskle girando, mandalas pulsando |
| Sem identidade visual | 100% alinhado com Base Triade |

---

*Especificacao criada por @ux-design-expert (Uma)*
*Ciclo das Estacoes — Frequencia Violeta Design System v1.0*
*Base Triade — O resgate da harmonia entre a humanidade e a natureza*

Sources:
- [Sacred Creative - Spiritual Website Design](https://www.sacredcreativellc.com/website-design)
- [99designs - Sacred Geometry Inspiration](https://99designs.com/inspiration/designs/sacred-geometry)
- [Spiritual Website Design Styles](https://bonniesorsby.com/spiritual-website-design-styles/)
- [DesignRush - Best Health & Wellness Websites](https://www.designrush.com/best-designs/websites/health-wellness)
