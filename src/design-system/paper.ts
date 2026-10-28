/** Paper component recipes. Every visual rule is a statically discoverable Tailwind utility.
 * Semantic names are retained for state selectors, accessibility tests and DOM inspection;
 * there are no matching component rules in CSS.
 */
const button =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-control border border-control px-3 py-1.5 min-h-[34px] text-[13px] leading-[18px] font-medium transition-colors hover:bg-neutral disabled:cursor-not-allowed disabled:opacity-45';
const primary =
  '[&.primary]:border-chalk [&.primary]:bg-chalk [&.primary]:text-white [&.primary:hover]:bg-ink [&_svg]:text-inherit';
const field =
  'block w-full rounded-control border border-line bg-surface px-3 py-2 mt-2 text-chalk';
const underline =
  "[&.active]:after:absolute [&.active]:after:-bottom-px [&.active]:after:left-[3px] [&.active]:after:right-[3px] [&.active]:after:h-0.5 [&.active]:after:rounded-sm [&.active]:after:bg-primary [&.active]:after:content-['']";
const emptyOutput =
  'flex flex-col items-start gap-3.5 px-6 py-14 [&>svg]:text-muted [&>h3]:text-lg';
const recipes: Record<string, string> = {
  app: 'relative flex h-dvh overflow-hidden bg-canvas font-sans text-[13px] leading-5 tracking-[-0.015em] text-ink [color-scheme:light] selection:bg-selection max-md:m-0 max-md:h-dvh max-md:rounded-none max-md:border-0 [&_svg]:shrink-0 [&_svg]:stroke-[1.75] [&_:where(.lucide)]:text-muted [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed [&_button:disabled]:opacity-45 [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-offset-[3px] [&_:focus-visible]:outline-primary [&_summary:focus-visible]:-outline-offset-2 [&_input]:accent-primary [&.navigation-collapsed>.sidebar]:hidden [&.navigation-collapsed>.navigation-divider]:hidden',
  sidebar:
    'relative flex w-(--navigation-width,232px) shrink-0 flex-col overflow-hidden bg-elevated max-md:absolute max-md:inset-y-0 max-md:left-0 max-md:z-40 max-md:w-[248px] max-md:shadow-popover',
  brand:
    'select-none [-webkit-tap-highlight-color:transparent] selection:bg-transparent [&_*]:select-none [&_*]:selection:bg-transparent flex h-20 shrink-0 items-center gap-3 px-5 py-4 text-[30px] leading-[30px] font-semibold tracking-[-0.02em] text-chalk',
  'window-controls':
    'absolute top-[18px] left-5 flex gap-[7px] [&>i]:size-3 [&>i]:rounded-full [&>i:nth-child(1)]:bg-[#ff5f57] [&>i:nth-child(2)]:bg-[#febc2e] [&>i:nth-child(3)]:bg-[#28c840]',
  'sidebar-settings':
    'mt-2 flex min-h-11 w-full items-center gap-5 px-4 text-[13px] text-chalk hover:bg-neutral rounded-control',
  'brand-mark': 'size-9',
  'navigation-collapse': 'absolute right-4 top-6 grid size-8 place-items-center text-muted',
  'sidebar-scroll': 'min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4',
  'section-label':
    'mb-2 flex h-9 items-center gap-2 px-1 text-[12px] font-normal tracking-[0.015em] text-ink uppercase [&>button]:ml-auto [&>button]:grid [&>button]:size-[30px] [&>button]:place-items-center [&>button]:rounded-control [&>button]:border [&>button]:border-control',
  'nav-row':
    'my-px inline-flex min-h-[38px] w-full items-center gap-3 rounded-control px-2.5 py-1 text-left text-[13px] leading-5 font-normal text-muted transition-colors hover:bg-[#eeece8] hover:text-ink [&>svg]:text-inherit [&>span]:min-w-0 [&>span]:truncate [&.selected]:bg-[#e9e7e3] [&.selected]:font-medium [&.selected]:text-chalk',
  'project-symbol': 'grid size-6 shrink-0 place-items-center text-inherit [&>svg]:text-inherit',
  'project-name': 'flex min-w-0 flex-1 flex-col [&>small]:hidden',
  'nav-add': 'hidden',
  divider: 'mt-4 mb-2 border-t border-line',
  'work-investigation-count': 'block text-[11px] leading-4 font-normal text-muted',
  'work-navigation-row':
    'relative flex items-center [&>.nav-row]:pr-2 [&>.nav-row]:gap-3 [&>.nav-row>span]:whitespace-nowrap [&>button:last-child]:absolute [&>button:last-child]:right-0 [&>button:last-child]:top-1/2 [&>button:last-child]:-translate-y-1/2 [&>button:last-child]:grid [&>button:last-child]:min-h-8 [&>button:last-child]:w-8 [&>button:last-child]:min-w-8 [&>button:last-child]:place-items-center [&>button:last-child]:p-0 [&>button:last-child]:opacity-0 hover:[&>button:last-child]:opacity-100 focus-within:[&>button:last-child]:opacity-100 max-md:[&>button:last-child]:opacity-100 [&>button:last-child>span]:hidden',
  'work-tasks': 'empty:hidden mb-2 ml-6 border-l border-line pl-1.5',
  'queue-scroll': 'min-w-0',
  'queue-item':
    'flex min-w-0 items-center gap-1 rounded-md border-l-2 border-transparent px-1.5 py-1.5 transition-colors hover:bg-neutral [&.selected]:border-[#9c9993] [&.selected]:bg-[#e9e7e3] [&.selected]:text-chalk',
  'queue-item-info': 'flex min-w-0 flex-1 items-start gap-2 py-0.5 text-left',
  'queue-item-status':
    'mt-0.5 flex items-center gap-1 text-[11px] text-muted [&.failed]:text-error motion-safe:[&.running]:animate-pulse',
  'queue-action':
    'flex size-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-neutral hover:text-chalk max-md:min-h-11',
  'queue-placeholder': 'hidden',
  'sidebar-bottom': 'px-4 pt-4 pb-3',
  'account-menu': 'relative',
  'account-trigger':
    'flex w-full items-center gap-3.5 rounded-panel border border-line p-2.5 text-[13px] [&>svg:last-child]:ml-auto',
  'account-avatar': 'grid size-8 place-items-center rounded-full bg-neutral',
  'account-popover':
    'absolute bottom-[calc(100%+8px)] left-0 z-45 w-[260px] rounded-popover border border-control bg-surface p-3 shadow-popover [&>p]:block [&>p]:p-2 [&>p]:text-[11px] [&>p]:text-muted [&>span]:block [&>span]:p-2 [&>span]:text-[11px] [&>span]:text-muted [&>span>span]:float-right [&_kbd]:float-right [&>button]:flex [&>button]:w-full [&>button]:items-center [&>button]:gap-2.5 [&>button]:rounded-md [&>button]:px-2 [&>button]:py-2.5 [&>button]:text-left [&>button:hover]:bg-neutral',
  main: 'flex min-w-0 flex-1 flex-col overflow-hidden',
  topbar:
    'flex h-[50px] min-h-[50px] shrink-0 items-center justify-between gap-4 border-b border-line bg-elevated px-6 max-md:px-3 max-md:[&>button]:ml-0',
  breadcrumbs:
    'flex min-w-0 items-center gap-4 text-xs text-chalk [&>span]:truncate [&>svg:first-child]:hidden [&>svg:nth-child(3)]:hidden max-md:flex-1 max-md:gap-1.5 max-md:[&>svg]:hidden max-md:[&>button]:hidden max-md:[&>span:not(:last-child)]:hidden',
  'breadcrumb-home': 'hidden',
  'work-crumb': 'max-w-64 max-lg:hidden',
  'search-wrap':
    'relative ml-auto flex w-[340px] items-center gap-2 rounded-control border border-line bg-canvas px-2.5 text-muted [&_input]:min-h-[30px] [&_input]:min-w-0 [&_input]:w-full [&_input]:bg-transparent [&_input]:py-1.5 [&_input]:text-xs [&_input]:placeholder:text-muted [&_kbd]:whitespace-nowrap [&_kbd]:rounded [&_kbd]:border [&_kbd]:border-line [&_kbd]:px-1 [&_kbd]:text-[10px] [&_kbd]:text-muted',
  'search-results':
    'absolute right-0 top-full z-30 mt-2 max-h-80 w-80 overflow-y-auto rounded-popover border border-control bg-surface p-2 shadow-popover [&>button]:flex [&>button]:w-full [&>button]:items-center [&>button]:gap-2 [&>button]:rounded-control [&>button]:p-3 [&>button]:text-left [&>button:hover]:bg-neutral',
  'topbar-actions': 'flex items-center gap-4 border-l border-line pl-4 max-[1101px]:hidden',
  'error-banner':
    'flex items-center gap-2 border-b border-error bg-error-surface px-6 py-2.5 text-xs text-error [&>button]:ml-auto',
  button,
  primary,
  implement:
    '[&.implement]:border-chalk [&.implement]:bg-chalk [&.implement]:text-white [&.implement:hover]:bg-ink',
  green: 'border-chalk bg-chalk text-white hover:bg-ink',
  danger: 'text-error border-error hover:bg-error-surface',
  subtle: 'border-transparent hover:border-control',
  'icon-button':
    'inline-flex size-8 shrink-0 items-center justify-center rounded-control text-muted transition-colors hover:bg-neutral hover:text-chalk max-md:size-11',
  'work-menu':
    'inline-flex size-8 shrink-0 items-center justify-center rounded-control transition-colors hover:bg-neutral',
  'console-workspace':
    'relative flex min-h-0 min-w-0 flex-1 overflow-hidden bg-surface [&.candidate-visible>.conversation-grid]:hidden [&.candidate-visible>.output-divider]:hidden [&.candidate-visible>.candidate-panel]:flex',
  'conversation-grid':
    'flex min-h-0 min-w-[360px] flex-[0_1_var(--conversation-width,47%)] flex-col max-[1101px]:min-w-0 max-[1101px]:flex-1',
  'work-heading':
    'grid min-h-20 grid-cols-[50px_minmax(0,1fr)_34px] items-center gap-x-[16px] px-4 pt-3 pb-2 [&>div]:contents [&_h1]:col-start-2 [&_h1]:row-start-1 [&_h1]:truncate [&_h1]:text-[26px] [&_h1]:leading-8 [&_h1]:font-semibold [&_h1]:tracking-[-0.03em] [&_h1]:text-chalk [&_p]:col-start-2 [&_p]:col-end-[-1] [&_p]:row-start-2 [&_p]:truncate [&_p]:text-xs [&_p]:leading-[18px] [&_p]:text-ink [&>.icon-button]:col-start-3 [&>.icon-button]:row-start-1 [&>.icon-button]:border [&>.icon-button]:border-line max-md:grid-cols-[40px_minmax(0,1fr)_32px] max-md:gap-x-3 max-md:p-3 max-md:[&_h1]:text-lg max-md:[&_p]:max-w-[76vw] max-md:[&>.icon-button]:col-start-3',
  'work-heading-icon':
    'col-start-1 row-start-1 row-end-3 grid size-[50px] shrink-0 place-items-center rounded-panel bg-selection text-primary-hover max-md:size-10 [&>svg]:text-primary-hover',
  'work-status':
    'col-start-3 row-start-1 flex items-center gap-2 whitespace-nowrap rounded-control border border-line px-3 py-1.5 text-[11px] leading-4 max-md:hidden',
  'work-status-dot': 'size-2 rounded-full bg-primary',
  'investigation-tabs':
    'pt-3 flex min-h-[54px] shrink-0 items-center gap-4 pl-[18px] pr-[58px] pb-2 max-md:pl-3',
  'investigation-tab-list':
    'flex min-w-0 flex-1 items-stretch gap-1.5 overflow-x-auto self-stretch [scrollbar-width:thin]',
  'investigation-tab': `relative flex min-h-[35px] max-h-[35px] shrink-0 items-center gap-2 rounded-control border border-line bg-elevated px-3 text-xs text-ink [&>span]:max-w-56 [&>span]:truncate [&>svg]:text-muted [&.active]:border-selection [&.active]:bg-selection [&.active]:text-chalk ${underline}`,
  console:
    '[&.empty-conversation]:justify-center [&.empty-conversation>.console-scroll]:hidden [&.empty-conversation>.console-status]:hidden [&.empty-conversation>.console-input]:mx-6 relative flex min-h-0 min-w-0 flex-1 flex-col bg-surface [--gutter:18px]',
  'investigation-options':
    "absolute right-[18px] -top-[43px] z-10 [&>summary]:grid [&>summary]:size-[34px] [&>summary]:cursor-pointer [&>summary]:list-none [&>summary]:place-items-center [&>summary]:rounded-control [&>summary]:border [&>summary]:border-line [&>summary]:bg-elevated [&>summary::-webkit-details-marker]:hidden [&>.console-controls]:absolute [&>.console-controls]:right-0 [&>.console-controls]:top-10 [&>.console-controls]:w-[210px] [&>.console-controls]:flex-col [&>.console-controls]:items-stretch [&>.console-controls]:rounded-popover [&>.console-controls]:border [&>.console-controls]:border-control [&>.console-controls]:bg-surface [&>.console-controls]:p-2 [&>.console-controls]:shadow-popover [&_.console-controls>button]:min-h-[34px] [&_.console-controls>button]:w-full [&_.console-controls>button]:justify-start [&_.console-controls>button]:text-left [&_.console-controls>.icon-button]:after:ml-2 [&_.console-controls>.icon-button]:after:text-xs [&_.console-controls>.icon-button]:after:content-['Rename_investigation']",
  'console-toolbar':
    'flex min-h-12 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-line px-6 py-2',
  'console-title': 'min-w-0 [&>h2]:truncate [&>h2]:text-sm [&>h2]:font-medium',
  'console-controls': 'flex flex-wrap items-center gap-1.5',
  'console-scroll':
    'min-h-0 flex-1 overflow-y-auto px-[18px] pt-3.5 pb-2.5 [scrollbar-width:thin] max-md:p-3',
  'console-welcome':
    'mx-auto max-w-xl px-5 py-9 [&>h3]:mb-3 [&>h3]:mt-6 [&>h3]:text-xl [&>h3]:leading-7 [&>h3]:font-semibold [&>h3]:tracking-tight',
  'console-comment': 'mb-6 text-sm leading-6 text-muted',
  'console-starters':
    'flex flex-col [&>button]:flex [&>button]:items-center [&>button]:justify-between [&>button]:gap-4 [&>button]:border-b [&>button]:border-line [&>button]:py-4 [&>button]:text-left [&>button:hover]:text-chalk [&_strong]:block [&_strong]:text-[13px] [&_strong]:font-medium [&_small]:mt-0.5 [&_small]:block [&_small]:text-[11px] [&_small]:text-muted',
  'welcome-footnote': 'mt-8 text-[11px] leading-5 text-muted',
  'console-notice': 'flex items-center gap-2 px-(--gutter) pb-3 text-[11px] text-attention',
  'console-output':
    '[&:has(.selection-anchor)_.console-inline-actions]:hidden group/message relative mb-7 ml-12 min-w-0 [&.artifact]:border-l-2 [&.artifact]:border-primary/30 [&.artifact]:pl-4 [&.user]:mb-10 [&.user]:rounded-panel [&.user]:border [&.user]:border-[#efd9d4] [&.user]:bg-[#fcf0ed] [&.user]:p-3 max-md:ml-9 [&.user_.console-output-glyph]:left-[-61px] [&.user_.console-output-glyph]:bg-transparent max-md:[&.user_.console-output-glyph]:left-[-49px] [&.user_.console-output-heading]:mb-[3px] [&.user_.console-inline-actions]:right-0',
  'console-output-heading':
    'relative mb-1.5 flex min-h-[20px] items-center gap-3 text-[12px] text-muted [&>strong]:text-[14px] [&>strong]:font-semibold [&>strong]:text-chalk',
  'console-output-glyph':
    'absolute -left-12 top-1/2 -translate-y-1/2 grid size-[38px] place-items-center rounded-full bg-elevated text-chalk max-md:-left-9 max-md:size-7',
  'console-model': 'ml-auto truncate text-[10px] text-muted max-md:hidden',
  'console-source':
    'mb-3 inline-flex items-center gap-2 text-[11px] text-primary-hover underline underline-offset-4',
  'console-output-content': 'min-w-0',
  'console-inline-actions':
    'absolute right-0 top-full z-10 -mt-1 flex max-w-full min-h-8 flex-wrap items-center gap-x-0.5 gap-y-0.5 rounded-lg border border-line bg-surface p-1 text-[11px] text-muted shadow-sm pointer-events-none opacity-0 group-hover/message:pointer-events-auto group-focus-within/message:pointer-events-auto transition-opacity group-hover/message:opacity-100 group-focus-within/message:opacity-100 [&>button]:inline-flex [&>button]:size-8 [&>button]:shrink-0 [&>button]:items-center [&>button]:justify-center [&>button]:gap-1.5 [&>button]:whitespace-nowrap [&>button]:rounded-md [&>button]:p-0 [&>button:hover]:bg-neutral [&>button:hover]:text-chalk max-md:static max-md:mt-2 max-md:opacity-100 max-md:pointer-events-auto max-md:[&>button]:min-h-11',
  'selection-clip': 'rounded-md bg-selection px-2 text-primary-hover',
  'message-content':
    'w-full min-w-0 max-w-none text-[14px] leading-[1.8] text-ink [&>:first-child]:mt-0 [&_p]:mb-4 [&_p]:whitespace-pre-wrap [&_p]:wrap-anywhere [&_p:last-child]:mb-0 [&_:is(h1,h2,h3,h4,h5,h6)]:mt-7 [&_:is(h1,h2,h3,h4,h5,h6)]:mb-3 [&_:is(h1,h2,h3,h4,h5,h6)]:font-semibold [&_:is(h1,h2,h3,h4,h5,h6)]:leading-snug [&_h1]:text-[28px] [&_h1]:font-extrabold [&_h1]:tracking-[-0.04em] [&_h1]:text-[#443351] [&_h2]:text-[21px] [&_h2]:font-semibold [&_h2]:tracking-[-0.025em] [&_h2]:text-[#68517c] [&_h3]:text-[17px] [&_h3]:font-semibold [&_h3]:text-[#68517c] [&_:is(h4,h5,h6)]:text-[13px] [&_:is(h4,h5,h6)]:text-chalk [&_strong]:font-semibold [&_strong]:text-[#3f3449] [&_em]:text-ink [&_a]:font-medium [&_a]:text-[#6951c7] [&_a]:underline [&_a]:decoration-[#bba6ee] [&_a]:decoration-2 [&_a]:underline-offset-4 [&_a:hover]:decoration-current [&_code]:font-mono [&_code]:text-[12px] [&_code]:leading-5 [&_code]:wrap-anywhere [&_:not(pre)>code]:rounded [&_:not(pre)>code]:bg-[#f0ebf5] [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:text-[#725885] [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1.5 [&_li]:pl-1 [&_li]:wrap-anywhere [&_li::marker]:font-medium [&_li::marker]:text-[#8b75a4] [&_li>ul]:my-1 [&_li>ol]:my-1 [&_.contains-task-list]:list-none [&_.contains-task-list]:pl-0 [&_.task-list-item]:flex-wrap [&_.task-list-item>input]:mr-2 [&_.task-list-item>input]:accent-[#80639b] [&_blockquote]:my-4 [&_blockquote]:rounded-xl [&_blockquote]:border-l-2 [&_blockquote]:border-[#ad94c3] [&_blockquote]:bg-[#f4eff8] [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:text-[#65556f] [&_blockquote>p]:mb-0 [&_hr]:my-5 [&_hr]:border-solid [&_hr]:border-[#cfbde5] [&_table]:w-full [&_table]:border-collapse [&_table]:text-left [&_table]:text-[13px] [&_th]:bg-[#efebf4] [&_th]:px-3 [&_th]:py-2.5 [&_th]:font-semibold [&_th]:text-[#633e92] [&_td]:border-t [&_td]:border-line [&_td]:px-3 [&_td]:py-2.5 [&_tbody>tr:nth-child(even)]:bg-[#faf8fc] [&_del]:text-muted',
  'findings-card':
    'mt-3 rounded-panel border border-line bg-elevated px-4 py-3 [&>h3]:mt-0 [&>h3]:mb-3 [&>h3]:text-[16px] [&>h3>svg]:box-content [&>h3>svg]:rounded-control [&>h3>svg]:bg-[#ffedc7] [&>h3>svg]:p-1.5 [&>h3]:flex [&>h3]:items-center [&>h3]:gap-3',
  'code-block':
    'my-5 overflow-hidden rounded-xl border border-[#38343f] bg-[#29262e] text-[#eee8f3] shadow-sm [&>div]:flex [&>div]:items-center [&>div]:gap-2 [&>div]:border-b [&>div]:border-[#423b4a] [&>div]:bg-[#312c38] [&>div]:px-4 [&>div]:py-2 [&>div]:text-[11px] [&>div]:text-[#c4b8d1] [&_button:hover]:bg-[#4b4058] [&_pre]:overflow-auto [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-[13px] [&_pre]:leading-6 [&_pre>code]:bg-transparent [&_pre>code]:p-0 [&_pre>code]:text-[#eee8f3] [&_pre>code]:whitespace-pre [&_pre>code]:[overflow-wrap:normal] [&_.code-keyword]:text-[#c8a4f4] [&_.code-string]:text-[#b9dbbb] [&_.code-comment]:text-[#a39aa9]',
  'reference-chips':
    'mt-3 flex gap-1.5 overflow-x-auto [&>button]:flex [&>button]:shrink-0 [&>button]:items-center [&>button]:gap-2 [&>button]:rounded-md [&>button]:border [&>button]:border-line [&>button]:bg-elevated [&>button]:px-2 [&>button]:py-1.5 [&>button]:text-[10px] [&>button]:text-chalk',
  'source-reference':
    'text-left font-mono text-[13px] text-primary-hover underline decoration-line underline-offset-[3px]',
  'activity-summary':
    'group/activity mt-2 overflow-hidden rounded-control border border-line bg-[#f6f6fb] text-ink [&.is-running]:border-info-surface [&>summary]:flex [&>summary]:min-h-[38px] [&>summary]:cursor-pointer [&>summary]:list-none [&>summary]:items-center [&>summary]:gap-2 [&>summary]:px-3 [&>summary]:py-2 [&>summary]:text-[13px] [&>summary]:leading-[18px] [&>summary::-webkit-details-marker]:hidden [&[open]>summary]:border-b [&[open]>summary]:border-line [&.is-running>summary]:bg-[#eff2ff] [&.is-running>summary]:text-chalk',
  'activity-disclosure': '-rotate-90 group-open/activity:rotate-0',
  'activity-count': 'ml-auto text-[11px]',
  'activity-entries': 'max-h-60 overflow-auto px-3 py-2',
  'activity-entry':
    'flex items-center gap-2 py-[5px] text-[13px] leading-[18px] [&>span]:min-w-0 [&>span]:wrap-anywhere',
  'console-input':
    'mx-3 mb-0 flex min-h-[88px] shrink-0 flex-col items-stretch gap-2 rounded-panel border border-[#cbc9c4] bg-white p-2.5 shadow-[0_3px_14px_#25213714] transition-colors min-[1101px]:max-[1251px]:flex-wrap max-md:flex-wrap',
  'console-prompt-row':
    '[&>textarea:focus-visible]:outline-none flex min-w-0 flex-1 [&>textarea]:min-h-10 [&>textarea]:max-h-[120px] [&>textarea]:w-full [&>textarea]:resize-none [&>textarea]:bg-transparent [&>textarea]:px-1 [&>textarea]:py-2 [&>textarea]:text-[13px] [&>textarea]:leading-[22px] [&>textarea]:placeholder:text-muted [&>textarea]:[field-sizing:content] min-[1101px]:max-[1251px]:basis-full max-md:basis-full',
  'console-prompt-mark': 'hidden',
  'console-input-footer':
    'flex w-full flex-nowrap items-center gap-2 text-[11px] text-muted [&>select]:min-h-[34px] [&>select]:min-w-0 [&>select]:max-w-[150px] [&>select]:rounded-md [&>select]:border [&>select]:border-line [&>select]:bg-elevated [&>select]:px-2 [&>select]:text-[11px] min-[1101px]:max-[1251px]:w-full min-[1101px]:max-[1251px]:justify-between max-md:w-full max-md:[&>select]:max-w-[220px]',
  'composer-context': 'hidden',
  'console-send':
    'ml-auto flex size-8 shrink-0 items-center justify-center rounded-control bg-[#25292f] text-white transition-colors hover:bg-ink disabled:opacity-45 [&>svg]:text-inherit max-md:size-9',
  'console-status':
    'flex min-h-[18px] shrink-0 flex-wrap items-center gap-2 px-[18px] py-0.5 text-[10px] text-metadata',
  'console-keyboard-hint': 'hidden',
  'stale-tag':
    'my-2 inline-flex rounded-md bg-attention-surface px-2 py-1 text-[11px] text-attention',
  'chat-task-update':
    'my-8 flex items-center gap-3 rounded-panel border border-line bg-surface p-4 [&>div]:min-w-0 [&>div]:flex-1 [&_strong]:block [&_strong]:text-[13px] [&_strong]:font-medium [&_strong]:wrap-anywhere [&_p]:mt-1 [&_p]:flex [&_p]:flex-wrap [&_p]:gap-2 [&_p]:text-[11px] [&_p]:text-muted [&>button]:flex [&>button]:items-center [&>button]:gap-2 [&>button]:py-2 [&>button]:text-xs [&>button:hover]:text-chalk',
  'task-update-icon': 'text-muted [&.failed]:text-error motion-safe:[&.running]:animate-pulse',
  'candidate-panel':
    '@container/output flex min-h-0 min-w-[360px] flex-1 flex-col overflow-hidden bg-surface max-[1101px]:hidden max-[1101px]:min-w-0 max-[1101px]:w-full',
  'output-toolbar':
    'flex h-[62px] min-h-[62px] shrink-0 items-center gap-2.5 border-b border-line px-3.5 py-3 [&>nav]:flex [&>nav]:min-w-0 [&>nav]:flex-1 [&>nav]:items-center [&>nav]:gap-2 @max-[560px]/output:[&>nav]:gap-0 max-[1251px]:[&>nav]:gap-0 max-[1251px]:[&>.icon-button]:hidden max-md:h-auto max-md:min-h-14 max-md:flex-wrap max-md:gap-1 max-md:p-2',
  'output-tab': `relative flex items-center gap-2 whitespace-nowrap rounded-control px-3 py-2 text-xs [&.active]:bg-selection [&.active]:font-semibold [&.active]:text-chalk [&>span]:rounded [&>span]:bg-neutral [&>span]:px-[5px] [&>span]:text-[11px] @max-[560px]/output:px-2 max-[1251px]:px-2 ${underline}`,
  'candidate-body':
    'min-h-0 flex-1 overflow-auto px-4 pt-2.5 pb-4 [scrollbar-width:thin] max-md:p-3 [&_h3]:mb-1.5 [&_h3]:text-[16px] [&_h3]:leading-5 [&_h3]:font-semibold [&_h3]:text-chalk [&_h4]:mt-6 [&_h4]:mb-2 [&_h4]:flex [&_h4]:items-center [&_h4]:gap-2 [&_h4]:font-medium [&_p]:whitespace-pre-wrap [&_p]:text-sm [&_p]:leading-[20px] [&_p]:text-ink [&_ul]:list-disc [&_ul]:pl-4 [&_li]:whitespace-pre-wrap [&_li]:wrap-anywhere',
  'output-identity':
    'mb-2.5 min-h-[42px] flex items-center gap-4 [&>div]:min-w-0 [&>div]:flex-1 [&_h2]:text-[16px] [&_h2]:leading-5 [&_h2]:font-semibold [&_h2]:text-chalk [&_h2]:tracking-[-0.01em] @max-[560px]/output:flex-wrap max-md:gap-3',
  'output-title-row': 'flex items-center gap-3 max-md:flex-wrap max-md:gap-2',
  'output-provenance':
    '[&.output-provenance]:mt-1 [&.output-provenance]:text-xs [&.output-provenance]:leading-[18px] [&.output-provenance]:text-muted',
  'output-state':
    'inline-flex shrink-0 items-center gap-1.5 rounded-md border border-transparent bg-success-surface px-2 py-1 text-[11px] leading-4 @max-[560px]/output:ml-10 max-md:ml-9',
  'paper-badge':
    'inline-flex items-center gap-2 whitespace-nowrap rounded-md border border-control bg-surface px-[9px] py-1 text-[11px]',
  'output-version': 'min-h-8',
  'implement-control': 'relative flex shrink-0 items-stretch',
  'implement-output':
    '[&.implement-output]:rounded-l-control [&.implement-output]:rounded-r-none max-[1251px]:px-2.5 max-md:gap-1 max-md:text-xs',
  'implement-menu':
    '[&>summary]:grid [&>summary]:min-h-[34px] [&>summary]:w-8 [&>summary]:cursor-pointer [&>summary]:list-none [&>summary]:place-items-center [&>summary]:rounded-r-control [&>summary]:border [&>summary]:border-l-0 [&>summary]:border-control [&>summary]:bg-elevated [&>summary::-webkit-details-marker]:hidden',
  'implement-popover':
    'absolute right-0 top-[calc(100%+8px)] z-20 w-[280px] rounded-popover border border-control bg-surface p-2 shadow-popover [&>button]:flex [&>button]:min-h-[34px] [&>button]:w-full [&>button]:items-center [&>button]:gap-2 [&>button]:rounded-md [&>button]:p-2 [&>button]:text-left [&>button]:text-[13px] [&>button:hover:not(:disabled)]:bg-neutral [&>p]:p-2 [&>p]:text-[11px] [&>p]:leading-4 [&>p]:text-muted',
  'output-sections': 'mb-3 flex overflow-x-auto rounded-control border border-line',
  'output-section-tab': `relative flex-1 whitespace-nowrap rounded-[7px] px-3 py-2 text-[11px] [&.active]:bg-selection [&.active]:font-semibold max-md:px-2 ${underline}`,
  'output-summary': 'flex gap-3 rounded-panel border border-[#e4ebdf] bg-[#f2f6ef] px-4 py-3',
  'summary-icon':
    'grid size-[30px] rounded-control bg-[#d6efdf] text-[#154c39] shrink-0 place-items-center',
  'output-goals':
    'my-2.5 grid grid-cols-2 gap-2 [&>section]:rounded-panel [&>section]:border [&>section]:border-line [&>section]:bg-surface [&>section]:px-4 [&>section]:py-3.5 [&_h3]:flex [&_h3]:items-center [&_h3]:gap-2 [&.output-goals_ul]:list-none [&.output-goals_ul]:p-0 [&_li]:my-1.5 [&_li]:flex [&_li]:items-start [&_li]:gap-2.5 [&_li]:text-[13px] [&_li]:leading-5 [&_li_svg]:mt-[3px] [&_li_svg.text-success]:fill-[#2cbd79] [&_li_svg.text-success]:text-white [&_small]:mt-2 [&_small]:block [&_small]:text-[11px] [&_small]:text-metadata @max-[560px]/output:grid-cols-1 min-[1101px]:max-[1251px]:grid-cols-1 max-md:grid-cols-1',
  'output-plan':
    'my-3 rounded-panel border border-line bg-surface px-4 py-3.5 [&_ul]:pl-[18px] [&_ul]:text-[13px] [&_ul]:leading-[21px] [&_li]:my-[5px]',
  'output-section-heading': 'mt-[18px] mb-2.5 flex items-center justify-between',
  'candidate-files':
    'overflow-hidden rounded-panel border border-line bg-surface [&>button]:flex [&>button]:w-full [&>button]:items-center [&>button]:gap-2 [&>button]:p-3 [&>button]:text-left [&>button]:font-mono [&>button]:text-[13px] [&>button]:leading-5 [&>button+button]:border-t [&>button+button]:border-line [&>button:hover]:bg-neutral [&_span]:min-w-0 [&_span]:flex-1 [&_span]:wrap-anywhere [&_small]:font-sans [&_small]:text-[10px] [&_small]:text-metadata',
  'output-note':
    '[&.output-note]:mt-2.5 [&.output-note]:text-[11px] [&.output-note]:leading-[18px] [&.output-note]:text-muted',
  'candidate-history':
    '[&_h3]:mt-5 [&_h3]:mb-3 [&_h3]:flex [&_h3]:items-center [&_h3]:gap-2 [&_select]:mt-2 [&_select]:block [&_select]:w-full [&_select]:rounded-control [&_select]:border [&_select]:border-line [&_select]:bg-canvas [&_select]:px-3 [&_select]:py-2 [&_select]:text-[13px]',
  'output-attempt':
    'flex w-full items-center gap-3 border-b border-line py-3 text-left [&>span]:flex-1 [&_small]:block [&_small]:text-metadata',
  'candidate-empty': emptyOutput,
  'output-empty-diff': emptyOutput,
  'output-version-warning':
    '[&.output-version-warning]:mb-4 [&.output-version-warning]:rounded-control [&.output-version-warning]:bg-attention-surface [&.output-version-warning]:p-3 [&.output-version-warning]:text-attention',
  'candidate-editor':
    '[&_label]:my-4 [&_label]:block [&_label]:text-xs [&_label]:text-muted [&_textarea]:min-h-[90px] [&_textarea]:resize-y',
  'candidate-field': field,
  'revision-comparison':
    'my-4 text-xs [&>summary]:cursor-pointer [&>summary]:text-primary-hover [&_del]:block [&_del]:whitespace-pre-wrap [&_del]:wrap-anywhere [&_del]:bg-diff-remove [&_del]:p-2 [&_del]:text-diff-remove-ink [&_del]:no-underline [&_ins]:block [&_ins]:whitespace-pre-wrap [&_ins]:wrap-anywhere [&_ins]:bg-diff-add [&_ins]:p-2 [&_ins]:text-diff-add-ink [&_ins]:no-underline',
  'candidate-handoff': 'rounded-control border border-line p-3 text-primary-hover',
  'pane-divider':
    "relative z-2 w-1.5 flex-[0_0_6px] touch-none cursor-col-resize bg-transparent after:absolute after:inset-y-0 after:left-0.5 after:w-px after:bg-line after:content-[''] hover:after:w-0.5 hover:after:bg-primary focus-visible:after:w-0.5 focus-visible:after:bg-primary",
  'navigation-divider': 'max-md:hidden',
  'output-divider': 'max-[1101px]:hidden',
  'mobile-output-toggle':
    'hidden items-center gap-2 self-end border-b border-line px-4 py-2 text-xs max-[1101px]:flex',
  'source-search': 'my-4 flex items-center gap-2',
  'source-explorer':
    'flex h-[60vh] overflow-hidden rounded-control border border-line [&>nav]:flex-[0_0_28%] [&>nav]:overflow-auto [&>nav]:border-r [&>nav]:border-line [&>nav>button]:flex [&>nav>button]:w-full [&>nav>button]:items-center [&>nav>button]:gap-2 [&>nav>button]:p-2.5 [&>nav>button]:text-left [&>nav>button]:font-mono [&>nav>button]:text-[11px] [&>nav>button]:wrap-anywhere [&>nav>button.active]:bg-selection [&>nav>button:hover]:bg-neutral [&>section]:min-w-0 [&>section]:flex-1 [&>section]:overflow-auto [&>section]:bg-canvas [&_header]:border-b [&_header]:border-line [&_header]:p-3 [&>section>p]:border-b [&>section>p]:border-line [&>section>p]:p-3 [&_pre]:min-w-max [&_pre]:py-3 [&_pre]:font-mono [&_pre]:text-[13px] [&_pre]:leading-5 [&_pre>div]:pr-4 [&_pre_span]:inline-block [&_pre_span]:w-[50px] [&_pre_span]:select-none [&_pre_span]:pr-4 [&_pre_span]:text-right [&_pre_span]:text-muted',
  'source-highlight': 'bg-selection',
  'recorded-diff':
    'flex min-h-0 min-w-0 flex-1 max-[1200px]:has-[.decision-trace]:[&>.diff-review]:hidden',
  'decision-trace':
    'w-[360px] min-w-[260px] overflow-auto border-l border-line bg-surface p-4 max-[1200px]:w-full [&>header]:mb-4 [&>header]:flex [&>header]:items-center [&>header]:gap-2 [&_h3]:min-w-0 [&_h3]:flex-1 [&_h3]:text-xs [&_h3]:wrap-anywhere [&_h4]:mt-6 [&_h4]:mb-2 [&_h4]:font-medium [&_p]:mt-2 [&_p]:mb-3.5 [&_p]:whitespace-pre-wrap [&_p]:leading-relaxed [&_p]:text-muted [&_ul]:list-disc [&_ul]:pl-4 [&_li]:my-2 [&_li]:whitespace-pre-wrap [&_li]:wrap-anywhere',
  'trace-source':
    'mt-3 block w-full rounded-md border border-line p-2 text-left text-xs text-muted',
  'diff-review':
    'min-w-0 flex-1 overflow-auto bg-elevated p-4 [&.proposed-diff]:bg-transparent [&.proposed-diff]:p-0 [&.proposed-diff_.diff-file]:mb-0 [&.proposed-diff_.diff-file]:min-h-[440px] [&.proposed-diff]:mt-3 [&.proposed-diff_.diff-mode-bar]:mb-0 [&.proposed-diff_.diff-mode-bar]:mt-0 [&.proposed-diff_.diff-file>header]:px-3 [&.proposed-diff_.diff-file>header]:gap-2 [&.proposed-diff_.paper-badge]:bg-attention-surface [&.proposed-diff_.paper-badge]:text-attention [&.proposed-diff_.paper-badge]:border-transparent [&.proposed-diff_.diff-mode-bar]:mt-0 [&.proposed-diff_.diff-mode-bar]:mb-2',
  'diff-mode-bar':
    'mb-3 flex items-center justify-between gap-3 text-xs text-muted [&>div]:flex [&>div]:overflow-hidden [&>div]:rounded-control [&>div]:border [&>div]:border-control [&_button]:flex [&_button]:min-h-8 [&_button]:items-center [&_button]:gap-1.5 [&_button]:px-3 [&_button]:py-[7px] [&_button]:text-xs [&_button[aria-pressed=true]]:bg-selection [&_button[aria-pressed=true]]:text-primary-hover',
  'diff-file':
    'mb-4 overflow-hidden rounded-panel border border-line bg-surface [&>header]:flex [&>header]:min-h-12 [&>header]:items-center [&>header]:gap-3 [&>header]:border-b [&>header]:border-line [&>header]:px-4 [&>header]:py-2 [&>header>code]:flex-1 [&>header>code]:font-sans [&>header>code]:font-semibold [&>header>code]:text-[13px] [&>header>code]:leading-5 [&>header>code]:wrap-anywhere',
  'diff-code-scroll': 'overflow-auto',
  'code-row':
    'flex min-h-[18px] w-full items-baseline whitespace-pre text-left font-mono text-[11px] leading-[18px] [&>code]:pr-4 [&.addition:hover]:outline [&.addition:hover]:-outline-offset-1 [&.addition:hover]:outline-primary',
  addition: 'bg-diff-add text-diff-add-ink',
  deletion: 'bg-diff-remove text-diff-remove-ink',
  'code-line-number': 'flex-[0_0_42px] select-none bg-elevated pr-2.5 text-right text-metadata',
  'code-marker': 'flex-[0_0_20px] select-none text-center',
  'code-hunk':
    'overflow-hidden whitespace-pre bg-neutral px-3 font-mono text-[11px] leading-[26px] text-muted',
  'split-code': 'min-w-[560px]',
  'split-code-row':
    'grid grid-cols-2 [&>:first-child]:border-r [&>:first-child]:border-line [&>.code-row]:overflow-auto [&>.code-row]:[scrollbar-width:thin]',
  'empty-code-row': 'bg-elevated',
  'code-keyword': 'text-info',
  'code-string': 'text-error',
  'code-comment': 'text-muted',
  'diff-empty': 'p-6 text-[13px] text-muted',
  'project-home':
    'flex min-h-0 flex-1 flex-col overflow-y-auto px-[max(28px,calc((100%-960px)/2))] py-12 max-md:py-6',
  'home-heading':
    'mb-10 flex items-start justify-between gap-4 max-md:flex-col [&>div]:min-w-0 [&_h1]:mt-2 [&_h1]:text-xl [&_h1]:font-semibold [&_p]:mt-2 [&_p]:text-[13px] [&_p]:text-muted [&_p]:wrap-anywhere',
  eyebrow: 'text-[10px] font-medium tracking-[0.06em] text-muted uppercase',
  'project-cards': 'flex flex-col',
  'project-card':
    'grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-b border-line py-5 text-left transition-colors hover:bg-surface max-md:grid-cols-[32px_minmax(0,1fr)] [&>h2]:text-sm [&>h2]:font-medium [&>p]:col-start-2 [&>p]:truncate [&>p]:font-mono [&>p]:text-[11px] [&>p]:text-muted [&>footer]:col-start-3 [&>footer]:row-span-2 [&>footer]:row-start-1 [&>footer]:flex [&>footer]:items-center [&>footer]:gap-4 [&>footer]:text-[11px] [&>footer]:text-muted max-md:[&>footer]:col-start-2 max-md:[&>footer]:row-start-3',
  'project-card-icon':
    'row-span-2 flex size-10 items-center justify-center rounded-control border border-line bg-surface',
  'project-empty':
    'flex min-h-64 flex-1 flex-col items-center justify-center gap-4 text-center text-muted [&>h2]:text-base [&>h2]:font-semibold [&>h2]:text-chalk [&>p]:text-[13px] [&>p]:leading-6',
  'import-empty':
    'flex min-h-80 flex-1 flex-col items-center justify-center gap-4 rounded-panel border border-dashed border-control p-6 transition-colors hover:border-muted hover:bg-surface [&>h2]:text-base [&>h2]:font-semibold [&>p]:text-[13px] [&>p]:text-muted',
  'import-illustration':
    'relative mb-4 [&>span]:absolute [&>span]:-right-2 [&>span]:-bottom-2 [&>span]:rounded-md [&>span]:bg-primary [&>span]:p-1 [&>span]:text-white',
  'home-footer':
    'mt-auto flex flex-wrap items-center gap-2 pt-10 text-[11px] text-muted [&>button]:ml-auto [&>button]:flex [&>button]:items-center [&>button]:gap-2 [&>button]:py-2 [&>button:hover]:text-chalk',
  'text-link':
    'inline-flex items-center gap-2 text-primary-hover underline underline-offset-4 transition-colors hover:text-chalk',
  'modal-backdrop':
    'fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-chalk/27 p-4 backdrop-blur-[3px]',
  modal:
    'relative max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-popover border border-control bg-surface p-6 shadow-popover [&.wide]:max-w-3xl has-[.source-explorer]:max-w-[1080px] [&_h2]:mb-3 [&_h2]:mt-1 [&_h2]:pr-8 [&_h2]:text-xl [&_h2]:leading-7 [&_h2]:font-semibold [&_p]:mb-4 [&_p]:text-[13px] [&_p]:leading-6 [&_p]:text-muted [&_label]:my-4 [&_label]:block [&_label]:text-[13px] [&_label]:font-medium [&_input:not([type=checkbox])]:mt-2 [&_input:not([type=checkbox])]:w-full [&_input:not([type=checkbox])]:rounded-control [&_input:not([type=checkbox])]:border [&_input:not([type=checkbox])]:border-control [&_input:not([type=checkbox])]:bg-canvas [&_input:not([type=checkbox])]:px-3 [&_input:not([type=checkbox])]:py-2 [&_input:not([type=checkbox])]:text-[13px] [&_textarea]:mt-2 [&_textarea]:min-h-24 [&_textarea]:w-full [&_textarea]:rounded-control [&_textarea]:border [&_textarea]:border-control [&_textarea]:bg-canvas [&_textarea]:p-3 [&_textarea]:text-[13px] [&_select]:mt-2 [&_select]:min-h-9 [&_select]:w-full [&_select]:rounded-control [&_select]:border [&_select]:border-control [&_select]:bg-canvas [&_select]:p-2 [&_select]:text-[13px]',
  'modal-close': 'absolute right-4 top-4',
  'modal-footer': 'mt-6 flex flex-wrap justify-end gap-2 border-t border-line pt-5',
  'field-label': 'mb-2 mt-5 text-[10px] font-medium tracking-[0.06em] text-muted uppercase',
  count: 'ml-1 rounded-md bg-selection px-1.5 py-0.5 text-[10px] text-muted',
  'pi-connection':
    'my-6 flex flex-wrap items-start gap-3 rounded-panel border border-line p-4 [&>div]:min-w-0 [&>div]:flex-1 [&_p]:mb-0 [&_p]:text-[11px]',
  'provider-list': 'max-h-60 overflow-auto',
  'provider-row':
    'flex items-center gap-3 border-b border-line py-3 [&_strong]:text-[13px] [&_strong]:font-medium [&_p]:mb-0 [&_p]:text-[11px]',
  'pane-icon': 'flex size-8 items-center justify-center rounded-control border border-line',
  'help-text': 'mt-4 text-[11px] leading-5',
  'details-pre':
    'my-4 max-h-80 overflow-auto rounded-control border border-line bg-canvas p-4 font-mono text-[11px]',
  'clip-preview': 'max-h-60 font-mono text-[11px]',
  findings: 'max-h-60 overflow-auto rounded-control border border-line px-3',
  finding:
    '[&.finding]:flex items-start gap-3 text-xs [&_input]:mt-1 [&_div]:min-w-0 [&_span]:block [&_span]:max-h-28 [&_span]:overflow-auto [&_span]:whitespace-pre-wrap [&_small]:mt-2 [&_small]:flex [&_small]:items-center [&_small]:gap-1 [&_small]:text-[10px] [&_small]:text-muted',
  'inline-warning':
    'my-4 flex items-start gap-2 rounded-control border border-attention bg-attention-surface p-3 text-xs text-attention',
  'handoff-fields': 'grid gap-x-4 md:grid-cols-2 [&>label:last-child]:col-span-full',
  'trust-approval':
    '[&.trust-approval]:flex items-start gap-3 rounded-control border border-control p-3 text-xs leading-5 [&_input]:mt-1',
  'preview-note': 'mt-4 flex items-center gap-2 text-[11px] text-muted',
  muted: 'text-muted',
  'folder-location':
    'my-4 flex items-center gap-2 [&>input]:mt-0 [&>input]:min-w-0 [&>input]:flex-1 [&>input]:font-mono [&>input]:text-[11px]',
  'folder-browser': 'h-64 overflow-auto rounded-control border border-line bg-canvas',
  'folder-row':
    'flex w-full items-center gap-3 border-b border-line px-3 py-2.5 text-left text-[13px] transition-colors hover:bg-neutral [&>span]:min-w-0 [&>span]:flex-1 [&>span]:truncate [&>small]:rounded-md [&>small]:border [&>small]:border-line [&>small]:px-1.5 [&>small]:py-0.5 [&>small]:text-[10px] [&>small]:text-muted',
  'parent-folder': 'text-muted',
  'folder-loading': 'flex min-h-40 items-center justify-center gap-2 text-[13px] text-muted',
  'import-selection': 'mt-4 flex items-center gap-2 text-[11px] text-muted',
  'import-error': '[&.import-error]:text-error',
  execution: 'flex min-h-0 flex-1 flex-col',
  'execution-head':
    'flex shrink-0 flex-wrap items-center gap-3 border-b border-line p-5 [&>div]:min-w-0 [&_h1]:text-base [&_h1]:font-semibold [&_h1]:wrap-anywhere',
  'execution-controls': 'ml-auto flex flex-wrap items-center gap-2',
  'followup-input': 'min-h-9 rounded-control border border-control bg-surface px-3 text-[13px]',
  'status-pill':
    'inline-flex rounded-md border border-line px-2 py-1 text-[11px] text-muted [&.failed]:border-error [&.failed]:text-error [&.passed]:border-success [&.passed]:text-success motion-safe:[&.running]:animate-pulse',
  'execution-layout': 'flex min-h-0 flex-1 max-lg:flex-col max-lg:overflow-auto',
  'run-details':
    'w-60 shrink-0 overflow-auto border-r border-line p-5 max-lg:max-h-52 max-lg:w-full max-lg:border-r-0 max-lg:border-b [&_p]:mb-3 [&_p]:text-[13px]',
  'model-chip': 'inline-flex rounded-md border border-line px-2 py-1 text-[11px] text-muted',
  'subagent-attempt': 'mt-3 flex items-center gap-2 text-[11px] text-muted',
  'activity-row': 'mb-2.5 flex items-start gap-2 text-[11px] text-muted',
  'activity-dot': 'mt-1.5 size-1.5 shrink-0 rounded-full bg-muted',
  'file-row': 'mb-2 flex items-center gap-2 font-mono text-[11px] wrap-anywhere',
  'run-output': 'flex min-h-0 min-w-0 flex-1 flex-col max-lg:min-h-80',
  tabs: 'flex shrink-0 gap-4 overflow-x-auto border-b border-line px-5 [&>button]:flex [&>button]:items-center [&>button]:gap-2 [&>button]:border-b-2 [&>button]:border-transparent [&>button]:py-2.5 [&>button]:text-[13px] [&>button]:text-muted [&>button.active]:border-primary [&>button.active]:text-chalk',
  'diff-scope-note':
    'flex items-center gap-2 border-b border-line px-5 py-2.5 text-[11px] text-muted',
  'diff-view': 'min-h-0 flex-1 overflow-auto py-4 font-mono text-[13px] leading-5 [&>div]:px-5',
  hunk: 'bg-elevated text-muted',
  'terminal-view': 'min-h-0 flex-1 overflow-auto bg-canvas p-5 font-mono text-xs leading-[19px]',
  'test-list': 'overflow-auto p-6',
  'test-card':
    'mb-4 rounded-control border border-line p-4 [&>h3]:mb-3 [&>h3]:flex [&>h3]:items-center [&>h3]:gap-2 [&>h3]:text-[13px] [&>pre]:overflow-auto [&>pre]:font-mono [&>pre]:text-[11px]',
  'summary-view': 'overflow-auto p-6 [&>h2]:mb-5 [&>h2]:text-base [&>h2]:font-semibold',
  toast:
    'fixed bottom-6 left-1/2 z-60 flex max-w-[90vw] -translate-x-1/2 items-center gap-2 rounded-popover border border-control bg-surface px-4 py-3 text-xs shadow-popover',
  spin: '[&.spin]:text-info motion-safe:animate-spin',
  'status-dot': 'inline-block size-1.5 shrink-0 rounded-full bg-primary [&.offline]:bg-muted',
  'workspace-loading':
    'flex min-h-60 flex-1 flex-col items-center justify-center gap-3 text-[13px] text-muted',
  'loading-companion': 'flex size-10 items-center justify-center [&>svg]:size-10',
  'loading-dots': 'motion-safe:animate-pulse',
  'agent-mark':
    'pointer-events-none select-none selection:bg-transparent inline-block size-8 shrink-0 align-middle [.brand_&]:size-12',
  'is-working': 'motion-safe:animate-pulse',
  'welcome-mark': 'size-10',
};

export function paper(names: string): string {
  return names
    .split(/\s+/)
    .filter(Boolean)
    .map((name) => (recipes[name] ? `${name} ${recipes[name]}` : name))
    .join(' ');
}
