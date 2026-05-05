import { render, screen, fireEvent } from '@testing-library/react'
import StoryCard from '@/components/StoryCard'
import type { Story } from '@/lib/types'

const story: Story = {
  id: 'abc123', lat: 31.5, lng: 34.8, countryCode: 'IL',
  headline: 'Gaza ceasefire talks collapse',
  summary: 'Negotiations broke down overnight.',
  url: 'https://example.com/story',
  source: 'Reuters', publishedAt: new Date().toISOString(), ago: '4m',
  category: 'conflict', importance: 5, minZoom: 2,
}

describe('StoryCard', () => {
  it('renders the headline', () => {
    render(<StoryCard story={story} onFlyTo={() => {}} />)
    expect(screen.getByText('Gaza ceasefire talks collapse')).toBeInTheDocument()
  })

  it('calls onFlyTo when clicked', () => {
    const fn = jest.fn()
    render(<StoryCard story={story} onFlyTo={fn} />)
    fireEvent.click(screen.getByText('Gaza ceasefire talks collapse'))
    expect(fn).toHaveBeenCalledWith(story.lat, story.lng)
  })
})
