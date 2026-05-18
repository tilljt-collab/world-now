import { render, screen, fireEvent } from '@testing-library/react'
import StreamTile from '@/components/StreamTile'

const tile = { name: 'BBC World News', region: 'Global', youtubeId: 'w_Ma8oQLmSM', live: true, channelUrl: 'https://www.youtube.com/@BBCNews/live' }

describe('StreamTile', () => {
  it('renders channel name', () => {
    render(<StreamTile {...tile} />)
    expect(screen.getByText('BBC World News')).toBeInTheDocument()
  })

  it('shows LIVE badge when live', () => {
    render(<StreamTile {...tile} />)
    expect(screen.getByText('● LIVE')).toBeInTheDocument()
  })

  it('collapses and expands on toggle click', () => {
    render(<StreamTile {...tile} />)
    const btn = screen.getByRole('button')
    // Starts expanded — iframe visible
    expect(screen.getByTitle('BBC World News')).toBeInTheDocument()
    fireEvent.click(btn)
    expect(screen.queryByTitle('BBC World News')).not.toBeInTheDocument()
    fireEvent.click(btn)
    expect(screen.getByTitle('BBC World News')).toBeInTheDocument()
  })
})
