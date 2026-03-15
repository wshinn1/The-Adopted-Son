import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') || 'The Adopted Son'
  const description = searchParams.get('description') || 'Daily Devotionals'
  const author = searchParams.get('author') || ''
  const imageUrl = searchParams.get('image') || ''

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#F5F2ED',
          position: 'relative',
        }}
      >
        {/* Background image overlay if provided */}
        {imageUrl && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.3,
              }}
            />
          </div>
        )}

        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: imageUrl 
              ? 'linear-gradient(135deg, rgba(245,242,237,0.95) 0%, rgba(245,242,237,0.85) 100%)'
              : 'linear-gradient(135deg, #F5F2ED 0%, #E8E4DD 100%)',
            display: 'flex',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            padding: '60px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Top: Site name */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                backgroundColor: '#B8860B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px',
                fontWeight: 'bold',
              }}
            >
              T
            </div>
            <span
              style={{
                fontSize: '24px',
                color: '#374151',
                fontWeight: 600,
              }}
            >
              The Adopted Son
            </span>
          </div>

          {/* Middle: Title and description */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              maxWidth: '900px',
            }}
          >
            <h1
              style={{
                fontSize: title.length > 60 ? '48px' : '64px',
                fontWeight: 'bold',
                color: '#1F2937',
                lineHeight: 1.1,
                margin: 0,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {title}
            </h1>
            {description && (
              <p
                style={{
                  fontSize: '24px',
                  color: '#6B7280',
                  margin: 0,
                  lineHeight: 1.4,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {description}
              </p>
            )}
          </div>

          {/* Bottom: Author and decorative element */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {author && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '20px', color: '#9CA3AF' }}>By</span>
                <span style={{ fontSize: '20px', color: '#4B5563', fontWeight: 600 }}>
                  {author}
                </span>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                gap: '8px',
              }}
            >
              <div
                style={{
                  width: '60px',
                  height: '4px',
                  backgroundColor: '#B8860B',
                  borderRadius: '2px',
                }}
              />
              <div
                style={{
                  width: '30px',
                  height: '4px',
                  backgroundColor: '#D4A84B',
                  borderRadius: '2px',
                }}
              />
              <div
                style={{
                  width: '15px',
                  height: '4px',
                  backgroundColor: '#E8C97B',
                  borderRadius: '2px',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
