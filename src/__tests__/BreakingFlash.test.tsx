import { render, screen } from '@testing-library/react'
import BreakingFlash from '@/components/BreakingFlash'

describe('BreakingFlash', () => {
  it('renders headline when visible', () => {
    render(<BreakingFlash headline="Major earthquake strikes Turkey" visible />)
    expect(screen.getByText(/Major earthquake/)).toBeInTheDocument()
  })

  it('renders nothing when not visible', () => {
    const { container } = render(<BreakingFlash headline="Test" visible={false} />)
    expect(container.firstChild).toBeNull()
  })
})
