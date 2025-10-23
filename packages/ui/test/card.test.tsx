import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../src/card'

describe('Card', () => {
  it('should render card with all parts', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    )

    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.getByText('Footer')).toBeInTheDocument()
  })

  it('should apply border and shadow classes to Card', () => {
    const { container } = render(<Card>Card content</Card>)
    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('border', 'shadow-sm')
  })

  it('should apply correct classes to CardTitle', () => {
    render(<CardTitle>Test Title</CardTitle>)
    const title = screen.getByText('Test Title')
    expect(title).toHaveClass('text-2xl', 'font-semibold')
  })

  it('should apply correct classes to CardDescription', () => {
    render(<CardDescription>Test Description</CardDescription>)
    const description = screen.getByText('Test Description')
    expect(description).toHaveClass('text-sm', 'text-slate-500')
  })

  it('should merge custom className', () => {
    const { container } = render(<Card className="custom-card">Custom</Card>)
    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('custom-card')
  })

  it('should forward ref for Card', () => {
    const ref = { current: null }
    render(<Card ref={ref}>With Ref</Card>)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })
})
