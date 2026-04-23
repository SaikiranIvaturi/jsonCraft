import { useState } from 'react'
import { Copy, Check, Download, Link } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { getShareUrl } from '@/lib/compression'
import { toast } from 'sonner'

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  json: string
}

export function ShareDialog({ open, onOpenChange, json }: ShareDialogProps) {
  const [copied, setCopied] = useState(false)

  const { url, tooLong } = getShareUrl(json)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('URL copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy URL')
    }
  }

  const handleDownload = () => {
    const blob = new Blob([json], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'jsoncraft-export.json'
    a.click()
    URL.revokeObjectURL(a.href)
    toast.success('Downloaded jsoncraft-export.json')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-4 w-4 text-primary" />
            Share JSON
          </DialogTitle>
          <DialogDescription>
            {tooLong
              ? 'This JSON is too large to encode in a URL. Download it instead.'
              : 'Share this URL to let others view your JSON. Everything is encoded client-side — nothing is sent to any server.'}
          </DialogDescription>
        </DialogHeader>

        {tooLong ? (
          <div className="flex flex-col gap-3">
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              JSON exceeds URL length limit (~2KB compressed). Download it as a file instead.
            </div>
            <Button onClick={handleDownload} className="w-full gap-2">
              <Download className="h-4 w-4" />
              Download as .json
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
              <span className="flex-1 text-xs font-mono text-muted-foreground truncate">
                {url}
              </span>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCopy} className="flex-1 gap-2">
                {copied ? (
                  <Check className="h-4 w-4 text-green-300" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? 'Copied!' : 'Copy URL'}
              </Button>
              <Button variant="outline" onClick={handleDownload} className="gap-2">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              🔒 Privacy: all processing happens in your browser
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
