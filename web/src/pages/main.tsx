import { useTheme } from '@/components/theme-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { PopoverClose } from '@radix-ui/react-popover'
import { Check, ChevronsUpDown, Files, GithubIcon, Loader2, Moon, Plus, Search, SendHorizonal, Sidebar, Sun, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { ReactMarkdown } from 'react-markdown/lib/react-markdown'
import { Link } from 'react-router-dom'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { dracula } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import remarkGfm from 'remark-gfm'
import { z } from 'zod'

const FormSchema = z.object({
  content: z.string()
})

type SearchResult = {
  title: string,
  description: string,
  rawDescription: string,
  hostname: string,
  icon: string,
  url: string
}

type Message = {
  role: 'Human' | 'Assistant',
  content: string,
  _meta?: {
    sources?: string[],
    query?: string,
    searchResults?: SearchResult[]
  }
}

type Chat = {
  id: string,
  title?: string,
  isActive: boolean,
  messages: Message[],
  createdAt: Date
}

function Main() {
  const { setTheme, theme } = useTheme()
  const [openSider, setOpenSider] = useState(false)
  const [loading, setLoading] = useState(false)
  const [chats, setChats] = useState<Chat[]>(JSON.parse(localStorage.getItem('chats') || '[]').map((c: Chat) => ({ ...c, createdAt: new Date(c.createdAt) })))
  const textRef = useRef<HTMLTextAreaElement>(null)
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      content: ''
    }
  })

  useEffect(() => {
    if (chats) {
      localStorage.setItem('chats', JSON.stringify(chats))
    }
  }, [chats])

  const prompt = async (data: z.infer<typeof FormSchema>) => {
    let chat = chats.find(c => c.isActive)
    if (!chat) {
      chat = {
        id: Date.now().toString(),
        title: 'Pertanyaan Baru',
        isActive: true,
        messages: [],
        createdAt: new Date()
      }
      setChats([...chats || [], chat])
    }

    setLoading(true)

    const msgs: Message[] = [...chat.messages || [], { role: 'Human', content: data.content }]
    setChats((chats: Chat[]) => chats.map(c => {
      if (c.id === chat?.id) {
        return {
          ...c,
          messages: msgs
        }
      }
      return c
    }))
    form.reset({
      content: ''
    })
    textRef.current?.style.setProperty('height', '0px')

    try {
      let meta: Message['_meta'] = {}

      const respQ = await fetch(`${import.meta.env.VITE_API_URL}/tools/findQuery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: msgs
        })
      })

      const { query } = await respQ.json()
      if (query) {
        meta = {
          ...meta,
          query
        }

        const resp = await fetch(`${import.meta.env.VITE_API_URL}/tools/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query
          })
        })

        const { results } = await resp.json() as { results?: { noResults: boolean, results: SearchResult[] } }
        if (results && !results.noResults) {
          meta = {
            ...meta,
            searchResults: results.results
          }
        }
      }

      setChats((chats: Chat[]) => chats.map(c => {
        if (c.id === chat?.id) {
          return {
            ...c,
            messages: [...msgs, {
              role: 'Assistant',
              content: '',
              _meta: meta
            }]
          }
        }
        return c
      }))

      const respBuilder = await fetch(`${import.meta.env.VITE_API_URL}/chats/builder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: msgs.map((m, i) => i === msgs.length - 1 ? {
            ...m,
            _meta: meta
          } : m)
        })
      })

      if (!respBuilder.ok) {
        try {
          const text = await respBuilder.text()
          setLoading(false)
          form.reset({
            content: msgs.at(-1)?.content || ''
          })
          return toast({
            title: 'Error',
            description: text
          })
        } catch (error) {
          setLoading(false)
          form.reset({
            content: msgs.at(-1)?.content || ''
          })
          return toast({
            title: 'Error',
            description: 'Silakan coba lagi 🙏'
          })
        }
      }

      const json = await respBuilder.json()

      if (json.sources?.length) {
        meta = {
          ...meta,
          sources: json.sources.map((m: { source: string }) => m.source)
        }
        setChats((chats: Chat[]) => chats.map(c => {
          if (c.id === chat?.id) {
            return {
              ...c,
              messages: [...msgs, {
                role: 'Assistant',
                content: '',
                _meta: meta
              }]
            }
          }
          return c
        }))
      }

      const resp = await fetch('https://tanyacapres.vercel.app/api/stream', {
        method: 'POST',
        body: JSON.stringify(json),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = resp.body
      if (!data) {
        return
      }

      setChats((chats: Chat[]) => chats.map(c => {
        if (c.id === chat?.id) {
          return {
            ...c,
            messages: msgs
          }
        }
        return c
      }))

      const reader = data.getReader()
      const decoder = new TextDecoder()
      let done = false

      let responseText: string = ''

      while (!done) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        const chunkValue = decoder.decode(value)
        if (!chunkValue) break

        responseText += chunkValue
        setChats((chats: Chat[]) => chats.map(c => {
          if (c.id === chat?.id) {
            return {
              ...c,
              messages: [...msgs, {
                role: 'Assistant',
                content: responseText,
                _meta: meta
              }]
            }
          }
          return c
        }))
      }

      if (responseText.startsWith('{"error":{')) {
        const msg = msgs.pop()
        setChats((chats: Chat[]) => chats.map(c => {
          if (c.id === chat?.id) {
            return {
              ...c,
              messages: msgs
            }
          }
          return c
        }))
        form.reset({
          content: msg?.content || ''
        })
        try {
          const json = JSON.parse(responseText)
          toast({
            title: 'Error',
            description: json.error.message
          })
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Silakan coba lagi 🙏'
          })
        }
        return
      }

      if (msgs?.length === 3 || json.sources?.length) {
        fetch('https://tanyacapres.vercel.app/api/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'Human',
                content: `Please give me a title for this conversation:

---
${[...msgs, { role: 'Assistant', content: responseText }].map(m => `${m.role}: ${m.content?.trim()}`).join('\n\n').slice(0, 1024)}}
---

Just give me the title result only without any other text in less than 30 characters.`
              }
            ]
          })
        }).then(async resp => {
          const data = resp.body
          if (!data) {
            return
          }

          const reader = data.getReader()
          const decoder = new TextDecoder()
          let done = false

          let responseText: string = ''

          while (!done) {
            const { value, done: doneReading } = await reader.read()
            done = doneReading
            const chunkValue = decoder.decode(value)
            if (!chunkValue) break

            responseText += chunkValue
            setChats((chats: Chat[]) => chats.map(c => {
              if (c.id === chat?.id) {
                return {
                  ...c,
                  title: responseText.startsWith('{"error":{') ? 'Pertanyaan Baru' : responseText
                }
              }
              return c
            }))
          }
        })
      }
    } catch (error) {
      const msg = msgs.pop()
      setChats((chats: Chat[]) => chats.map(c => {
        if (c.id === chat?.id) {
          return {
            ...c,
            messages: msgs
          }
        }
        return c
      }))
      form.reset({
        content: msg?.content || ''
      })
      toast({
        title: 'Error',
        description: 'Silakan coba lagi 🙏'
      })
    } finally {
      setLoading(false)
      textRef.current?.focus()
    }
  }

  return <div className="container py-4">
    <Sheet open={openSider} onOpenChange={setOpenSider}>
      <div className="flex justify-between gap-2 items-center min-h-[36px]">
        <div className="block lg:hidden">
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm">
              <Sidebar className="h-4 w-4" />
            </Button>
          </SheetTrigger>
        </div>
        <h2 className="text-lg tracking-tight space-x-2 flex items-center font-medium">
          <img src="/logo.png" alt="logo" className="h-6 w-6" />
          <span>TanyaCapres</span>
          <Badge>2.0</Badge>
        </h2>
      </div>
      <Separator className="my-3" />
      <div className="flex flex-row lg:space-x-12 space-y-0">
        <div className="w-full md:w-3/12 hidden lg:flex flex-col gap-2">
          <Button variant="outline" className="flex justify-start gap-2" onClick={() => {
            setChats((chats: Chat[]) => chats.map(c => ({
              ...c,
              isActive: false
            })))
            textRef.current?.focus()
          }}>
            <Plus className="h-4 w-4" />
            <span>Chat Baru</span>
          </Button>
          <ScrollArea className="h-[calc(100svh-222px)] flex flex-col">
            {chats.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).map((chat, i) => <div key={i} className="flex">
              <Button key={i} variant={chat.isActive ? 'secondary' : 'ghost'} className="inline-grid truncate !justify-start w-full grow" onClick={() => {
                setChats((chats: Chat[]) => chats.map(c => ({
                  ...c,
                  isActive: c.id === chat.id
                })))
                textRef.current?.focus()
              }}>
                <span className="truncate">{chat.title}</span>
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="opacity-40 hover:opacity-100">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="space-y-3 w-[216px]">
                  <p className="text-muted-foreground">
                    Apakah kamu yakin ingin menghapus chat ini?
                  </p>
                  <div className="flex gap-2 justify-end">
                    <PopoverClose asChild>
                      <Button size="sm" onClick={() => {
                        setChats((chats: Chat[]) => chats.filter(c => c.id !== chat.id))
                      }}>
                        <Check className="h-4 w-4 mr-2" />
                        Ya
                      </Button>
                    </PopoverClose>
                    <PopoverClose asChild>
                      <Button size="sm" variant="ghost">
                        Batal
                      </Button>
                    </PopoverClose>
                  </div>
                </PopoverContent>
              </Popover>
            </div>)}
          </ScrollArea>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            {chats?.length ? <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="flex justify-start gap-2 text-red-400 grow">
                  <Trash2 className="h-4 w-4" />
                  <span>Hapus Semua</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="space-y-3 w-[216px]">
                <p className="text-muted-foreground">
                  Apakah kamu yakin ingin menghapus semua chat?
                </p>
                <div className="flex justify-end gap-2">
                  <Button onClick={() => setChats([])}>
                    <Check className="h-4 w-4 mr-2" />
                    Ya
                  </Button>
                  <PopoverClose asChild>
                    <Button variant="ghost">
                      Batal
                    </Button>
                  </PopoverClose>
                </div>
              </PopoverContent>
            </Popover> : <></>}
          </div>
          <div className="flex items-center mt-1">
            <Button variant="link" size="sm" asChild className="!h-fit">
              <Link to="/disclaimer">
                <span className="text-muted-foreground font-normal text-xs">
                  Disclaimer
                </span>
              </Link>
            </Button>
            <Separator orientation="vertical" />
            <Button variant="link" size="sm" asChild className="!h-fit">
              <Link to="/terms">
                <span className="text-muted-foreground font-normal text-xs">
                  Terms
                </span>
              </Link>
            </Button>
            <Separator orientation="vertical" />
            <Button variant="link" size="sm" asChild className="!h-fit">
              <Link to="/privacy">
                <span className="text-muted-foreground font-normal text-xs">
                  Privacy
                </span>
              </Link>
            </Button>
            <Separator orientation="vertical" />
            <Button variant="link" size="sm" asChild className="!h-fit">
              <a href="https://github.com/mgilangjanuar/tanyacapres-2.0" target="_blank">
                <span className="text-muted-foreground font-normal text-xs">
                  <GithubIcon className="h-3 w-3" />
                </span>
              </a>
            </Button>
          </div>
        </div>
        <div className="flex-1 relative">
          {chats.find(c => c.isActive) ? <ScrollArea className={cn(
            'h-[calc(100svh-95px)] mx-auto relative p-1'
          )}>
            {chats.find(c => c.isActive)?.messages.map((msg, i) => <div key={i} className={cn(
              'prose max-w-full',
              msg.role === 'Human' ? 'bg-zinc-100 p-5 md:p-7 rounded-md' : 'py-5 md:py-7 md:pr-1.5 pr-0 !text-foreground',
              i === (chats.find(c => c.isActive)?.messages.length || 0) - 1 ? 'mb-12' : ''
            )}>
              {msg._meta?.sources?.length ? <Collapsible>
                <CollapsibleTrigger asChild>
                  <p className="text-muted-foreground mt-0 text-sm flex gap-2 items-center hover:cursor-pointer">
                    <span><Files className="h-3 w-3" /></span>
                    <span>Retrieved from docs</span>
                    <span><ChevronsUpDown className="h-3 w-3" /></span>
                  </p>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="my-5 flex flex-col gap-2">
                    {msg._meta.sources.map((m: any, i: number) => <div key={i} className="rounded-md border px-4 py-3 text-sm lg:truncate">
                      {m.split(', similarity:')?.[0]}
                    </div>)}
                  </div>
                </CollapsibleContent>
              </Collapsible> : <></>}
              {msg._meta?.searchResults?.length ? <Collapsible defaultOpen={i === (chats.find(c => c.isActive)?.messages.length || 0) - 1}>
                <CollapsibleTrigger asChild>
                  <p className="text-muted-foreground mt-0 text-sm flex gap-2 items-center hover:cursor-pointer">
                    <span><Search className="h-3 w-3" /></span>
                    <span>Retrieved from DuckDuckGo</span>
                    <span><ChevronsUpDown className="h-3 w-3" /></span>
                  </p>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {/* <p className="text-xs mt-0 text-muted-foreground">
                    <span>Search: </span>
                    <strong className="!text-muted-foreground">{msg._meta.query}</strong>
                  </p> */}
                  <div className="flex flex-col gap-2">
                    {msg._meta.searchResults.slice(0, 3).map((m, i) => <div key={i} className="rounded-md border px-4 py-3 text-sm">
                      <div className="flex gap-2 truncate items-center">
                        <div>
                          <img src={m.icon} alt={m.hostname} className="h-4 w-4 my-0 rounded-full" />
                        </div>
                        <div>
                          <span className="truncate">{m.hostname}</span>
                        </div>
                      </div>
                      <p className="text-lg my-2 !text-foreground">
                        <a href={m.url} target="_blank" rel="noreferrer" className="no-underline hover:underline !text-foreground" dangerouslySetInnerHTML={{ __html: m.title }} />
                      </p>
                      <p dangerouslySetInnerHTML={{ __html: m.rawDescription }} className="text-sm my-0" />
                    </div>)}
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <p className="mx-auto justify-center text-muted-foreground mb-0 mt-1 text-sm flex gap-2 items-center hover:cursor-pointer">
                          <span><ChevronsUpDown className="h-3 w-3" /></span>
                          <span>See more</span>
                        </p>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="flex flex-col gap-2 [&>*:first-child]:mt-3">
                        {msg._meta.searchResults.slice(3, 10).map((m, i) => <div key={i} className="rounded-md border px-4 py-3 text-sm">
                          <div className="flex gap-2 truncate items-center">
                            <div>
                              <img src={m.icon} alt={m.hostname} className="h-4 w-4 my-0 rounded-full" />
                            </div>
                            <div>
                              <span className="truncate">{m.hostname}</span>
                            </div>
                          </div>
                          <p className="text-lg my-2 !text-foreground">
                            <a href={m.url} target="_blank" rel="noreferrer" className="no-underline hover:underline !text-foreground" dangerouslySetInnerHTML={{ __html: m.title }} />
                          </p>
                          <p dangerouslySetInnerHTML={{ __html: m.rawDescription }} className="text-sm my-0" />
                        </div>)}
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </CollapsibleContent>
              </Collapsible> : <></>}
              {!msg.content.trim() ? <div className="my-4 space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[260px]" />
              </div> : <></>}
              <ReactMarkdown
                children={msg.content.trim()}
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    return !inline ? (
                      <SyntaxHighlighter
                        children={String(children).replace(/\n$/, '')}
                        style={dracula as any}
                        language={match?.[1]}
                        PreTag="div"
                        {...props}
                      />
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  }
                }} />
            </div>)}
          </ScrollArea> : <div className="h-[calc(100svh-95px)] pb-16 flex flex-col items-center justify-center gap-6">
            <div className="flex flex-col items-center">
              <div className="mb-4 hidden md:block">
                <img src="/logo.png" alt="logo" className="w-28 h-28" />
              </div>
              <div className="flex items-start gap-1.5">
                <h3 className="text-2xl font-semibold">
                  TanyaCapres
                </h3>
                <Badge>2.0</Badge>
              </div>
              <p className="text-muted-foreground">
                Tanyakan apa pun untuk para kandidat.
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <div>
                <img src="/amin.png" alt="logo" className="w-20 h-20 rounded-full" />
              </div>
              <div>
                <img src="/prabu.png" alt="logo" className="w-20 h-20 rounded-full" />
              </div>
              <div>
                <img src="/gama.png" alt="logo" className="w-20 h-20 rounded-full" />
              </div>
            </div>
            <div className="flex gap-2 flex-col items-center">
              <div className="rounded-md border px-4 py-3 text-sm w-full text-center hover:cursor-pointer opacity-75 hover:opacity-100" onClick={() => {
                form.reset({
                  content: 'Visi misi capres di bidang pendidikan?'
                })
                form.handleSubmit(prompt)()
                form.reset()
              }}>
                Visi misi capres di bidang pendidikan?
              </div>
              <div className="rounded-md border px-4 py-3 text-sm w-full text-center hover:cursor-pointer opacity-75 hover:opacity-100" onClick={() => {
                form.reset({
                  content: 'Cara meningkatkan kesejahteraan petani dari masing-masing calon?'
                })
                form.handleSubmit(prompt)()
                form.reset()
              }}>
                Cara meningkatkan kesejahteraan petani dari masing-masing calon?
              </div>
              <div className="rounded-md border px-4 py-3 text-sm w-full text-center hover:cursor-pointer opacity-75 hover:opacity-100" onClick={() => {
                form.reset({
                  content: 'Kebijakan para kandidat dalam pemberantasan korupsi?'
                })
                form.handleSubmit(prompt)()
                form.reset()
              }}>
                Kebijakan para kandidat dalam pemberantasan korupsi?
              </div>
            </div>
          </div>}
          <div className={cn(
            'w-full mx-auto',
            'absolute bottom-0'
          )}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(prompt)}>
                <FormField control={form.control} name="content" render={({ field }) => <FormItem className="grow !m-0 relative">
                  <FormControl>
                    <Textarea
                      autoFocus
                      placeholder="Tanyakan sekarang..."
                      className="resize-none py-3 no-scrollbar"
                      style={{ height: '0px', minHeight: '3rem', paddingRight: '3.5rem' }}
                      required
                      readOnly={loading}
                      {...field}
                      ref={textRef}
                      onChange={e => {
                        e.target.style.height = '0px'
                        const scrollHeight = e.target.scrollHeight
                        e.target.style.height = scrollHeight < 104 ? scrollHeight + 'px' : '104px'
                        field.onChange(e)
                      }}
                      onBlur={({ target }) => {
                        target.style.height = '0px'
                        const scrollHeight = target.scrollHeight
                        target.style.height = scrollHeight < 104 ? scrollHeight + 'px' : '104px'
                        field.onBlur()
                      }}
                      onKeyDown={(e) => {
                        if (e.key.toLowerCase() === 'enter' && !e.shiftKey && !e.metaKey) {
                          e.preventDefault()
                          if (!textRef.current?.value) return
                          form.handleSubmit(prompt)()
                          // prompt({
                          //   content: textRef.current.value,
                          //   temperature: temp
                          // })
                        }
                      }}
                    />
                  </FormControl>
                </FormItem>} />
                <Button disabled={loading} type="submit" size="icon" className="absolute bottom-1 right-1.5">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
      <SheetContent side="left" className="w-full">
        <div className="w-full flex !flex-col pt-7 gap-2">
          <Button variant="outline" className="flex justify-start gap-2" onClick={() => {
            setChats((chats: Chat[]) => chats.map(c => ({
              ...c,
              isActive: false
            })))
            setOpenSider(false)
            setTimeout(() => {
              textRef.current?.focus()
            }, 400)
          }}>
            <Plus className="h-4 w-4" />
            <span>Chat Baru</span>
          </Button>
          <ScrollArea className="h-[calc(100svh-200px)] flex flex-col">
            {chats.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).map((chat, i) => <div key={i} className="flex">
              <Button key={i} variant={chat.isActive ? 'secondary' : 'ghost'} className="inline-grid truncate !justify-start w-full grow" onClick={() => {
                setChats((chats: Chat[]) => chats.map(c => ({
                  ...c,
                  isActive: c.id === chat.id
                })))
                setOpenSider(false)
                setTimeout(() => {
                  textRef.current?.focus()
                }, 400)
              }}>
                <span className="truncate">{chat.title}</span>
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="opacity-40 hover:opacity-100">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="space-y-3 w-[216px]">
                  <p className="text-muted-foreground">
                    Apakah kamu yakin ingin menghapus chat ini?
                  </p>
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" onClick={() => {
                      setChats((chats: Chat[]) => chats.filter(c => c.id !== chat.id))
                    }}>
                      <Check className="h-4 w-4 mr-2" />
                      Ya
                    </Button>
                    <PopoverClose asChild>
                      <Button size="sm" variant="ghost">
                        Batal
                      </Button>
                    </PopoverClose>
                  </div>
                </PopoverContent>
              </Popover>
            </div>)}
          </ScrollArea>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            {chats?.length ? <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="flex justify-start gap-2 text-red-400 grow">
                  <Trash2 className="h-4 w-4" />
                  <span>Hapus Semua</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="space-y-3 w-[216px]">
                <p className="text-muted-foreground">
                  Apakah kamu yakin ingin menghapus semua chat?
                </p>
                <div className="flex justify-end gap-2">
                  <Button onClick={() => setChats([])}>
                    <Check className="h-4 w-4 mr-2" />
                    Ya
                  </Button>
                  <PopoverClose asChild>
                    <Button variant="ghost">
                      Batal
                    </Button>
                  </PopoverClose>
                </div>
              </PopoverContent>
            </Popover> : <></>}
          </div>
          <div className="flex items-center mt-1">
            <Button variant="link" size="sm" asChild className="!h-fit">
              <Link to="/disclaimer">
                <span className="text-muted-foreground font-normal text-xs">
                  Disclaimer
                </span>
              </Link>
            </Button>
            <Separator orientation="vertical" />
            <Button variant="link" size="sm" asChild className="!h-fit">
              <Link to="/terms">
                <span className="text-muted-foreground font-normal text-xs">
                  Terms
                </span>
              </Link>
            </Button>
            <Separator orientation="vertical" />
            <Button variant="link" size="sm" asChild className="!h-fit">
              <Link to="/privacy">
                <span className="text-muted-foreground font-normal text-xs">
                  Privacy
                </span>
              </Link>
            </Button>
            <Separator orientation="vertical" />
            <Button variant="link" size="sm" asChild className="!h-fit">
              <a href="https://github.com/mgilangjanuar/tanyacapres-2.0" target="_blank">
                <span className="text-muted-foreground font-normal text-xs">
                  <GithubIcon className="h-3 w-3" />
                </span>
              </a>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  </div>
}

export default Main
