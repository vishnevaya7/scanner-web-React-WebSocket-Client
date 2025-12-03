import React from 'react'

type Props = {
  title: string
  right?: React.ReactNode
}

export default function Header({ title, right }: Props) {
  return (
    <div className="header">
      <div className="title">{title}</div>
      <div className="actions">{right}</div>
    </div>
  )
}
