'use client'

import BookmarkBtn from '@/components/BookmarkBtn'
import PostCardCommentBtn from '@/components/PostCardCommentBtn'
import PostCardLikeBtn from '@/components/PostCardLikeBtn'
import { TPostDetail } from '@/data/posts'
import { Button } from '@/shared/Button'
import { Dialog, DialogActions, DialogBody, DialogTitle } from '@/shared/dialog'
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '@/shared/dropdown'
import {
  ClipboardIcon,
  Comment01Icon,
  Facebook01Icon,
  Flag03Icon,
  Mail01Icon,
  MoreHorizontalIcon,
  NewTwitterIcon,
  Share03Icon,
  ViewOffSlashIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import clsx from 'clsx'
import { FC, useState } from 'react'

function ActionDropdown({ handle, title, author }: { handle: string; title: string; author: TPostDetail['author'] }) {
  const [isOpenDialogHideAuthor, setIsOpenDialogHideAuthor] = useState(false)
  const [isOpenDialogReportPost, setIsOpenDialogReportPost] = useState(false)

  const actions = [
    {
      name: 'Copy link',
      icon: ClipboardIcon,
      onClick: () => {
        navigator.clipboard.writeText(window.location.href)
      },
    },
    {
      name: 'Comment on this post',
      icon: Comment01Icon,
      href: '#comments',
    },
    {
      name: 'Hide this author',
      icon: ViewOffSlashIcon,
      onClick: () => {
        setIsOpenDialogHideAuthor(true)
      },
    },
    {
      name: 'Report this post',
      icon: Flag03Icon,
      onClick: () => {
        setIsOpenDialogReportPost(true)
      },
    },
  ]

  return (
    <>
      <Dropdown>
        <DropdownButton
          as="button"
          className="flex size-8.5 items-center justify-center rounded-full bg-neutral-50 transition-colors duration-300 hover:bg-neutral-100 dark:bg-white/10 dark:hover:bg-white/20"
        >
          <HugeiconsIcon icon={MoreHorizontalIcon} size={20} />
        </DropdownButton>
        <DropdownMenu>
          {actions.map((item) =>
            item.href ? (
              <DropdownItem key={item.name} href={item.href} onClick={item.onClick}>
                <HugeiconsIcon icon={item.icon} size={20} data-slot="icon" />
                {item.name}
              </DropdownItem>
            ) : (
              <DropdownItem key={item.name} onClick={item.onClick}>
                <HugeiconsIcon icon={item.icon} size={20} data-slot="icon" />
                {item.name}
              </DropdownItem>
            )
          )}
        </DropdownMenu>
      </Dropdown>

      {/* DIALOG HIDE AUTHOR */}
      <Dialog open={isOpenDialogHideAuthor} onClose={() => setIsOpenDialogHideAuthor(false)}>
        <DialogTitle>
          Hide this author? <span className="font-semibold">({author.name.trim()})</span>
        </DialogTitle>
        <DialogBody>
          <p>
            Are you sure you want to hide the <span className="font-semibold">{author.name.trim()}</span>? This action
            will hide all posts from this author.
          </p>
        </DialogBody>
        <DialogActions>
          <Button plain onClick={() => setIsOpenDialogHideAuthor(false)}>
            Cancel
          </Button>
          <Button onClick={() => setIsOpenDialogHideAuthor(false)}>Hide</Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG REPORT POST */}
      <Dialog open={isOpenDialogReportPost} onClose={() => setIsOpenDialogReportPost(false)}>
        <DialogTitle>Report this post?</DialogTitle>
        <DialogBody>
          <p>
            Are you sure you want to report the <span className="font-semibold">&quot;{title.trim()}&quot;</span>? This
            action will report this post.
          </p>
        </DialogBody>
        <DialogActions>
          <Button plain onClick={() => setIsOpenDialogReportPost(false)}>
            Cancel
          </Button>
          <Button onClick={() => setIsOpenDialogReportPost(false)}>Report</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

interface ShareSettings {
  enabled: boolean
  facebook: boolean
  twitter: boolean
  linkedin: boolean
  email: boolean
}

function ShareDropdown({ handle, title, shareSettings }: { handle: string; title?: string; shareSettings?: ShareSettings }) {
  const defaultSettings: ShareSettings = {
    enabled: true,
    facebook: true,
    twitter: true,
    linkedin: false,
    email: true,
  }
  const settings = shareSettings || defaultSettings
  
  if (!settings.enabled) return null

  const shareUrl = typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : ''
  const shareTitle = encodeURIComponent(title || '')

  const socialsShare = [
    settings.facebook && {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
      icon: Facebook01Icon,
    },
    settings.twitter && {
      name: 'Twitter',
      href: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`,
      icon: NewTwitterIcon,
    },
    settings.email && {
      name: 'Email',
      href: `mailto:?subject=${shareTitle}&body=Check out this article: ${shareUrl}`,
      icon: Mail01Icon,
    },
  ].filter(Boolean) as { name: string; href: string; icon: typeof Facebook01Icon }[]

  if (socialsShare.length === 0) return null

  return (
    <Dropdown>
      <DropdownButton
        as="button"
        className="flex size-8.5 items-center justify-center rounded-full bg-neutral-50 transition-colors duration-300 hover:bg-neutral-100 dark:bg-white/10 dark:hover:bg-white/20"
      >
        <HugeiconsIcon icon={Share03Icon} size={20} />
      </DropdownButton>
      <DropdownMenu>
        {socialsShare.map((item, index) => (
          <DropdownItem key={index} href={item.href} target="_blank" rel="noopener noreferrer">
            <HugeiconsIcon icon={item.icon} size={20} data-slot="icon" />
            {item.name}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  )
}

interface Props extends Pick<TPostDetail, 'likeCount' | 'liked' | 'commentCount' | 'handle' | 'title' | 'author'> {
  className?: string
  shareSettings?: ShareSettings
}

const SingleMetaAction: FC<Props> = ({ className, likeCount, liked, commentCount, handle, title, author, shareSettings }) => {
  return (
    <div className={clsx('single-meta-action', className)}>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
        <PostCardLikeBtn likeCount={likeCount} liked={liked} />
        <PostCardCommentBtn commentCount={commentCount} handle={handle} />
        <p className="font-light text-neutral-400 sm:mx-1">/</p>
        <BookmarkBtn className="size-8.5!" />
        <ShareDropdown handle={handle} title={title} shareSettings={shareSettings} />
        <ActionDropdown handle={handle} title={title} author={author} />
      </div>
    </div>
  )
}

export { ActionDropdown, ShareDropdown, SingleMetaAction }
export type { ShareSettings }
