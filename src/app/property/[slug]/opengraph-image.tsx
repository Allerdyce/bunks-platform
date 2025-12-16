import { ImageResponse } from 'next/og';
import { fetchMarketingProperties } from '@/lib/marketingProperties';

export const runtime = 'edge';

export const alt = 'Bunks Property';
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = 'image/png';

export default async function Image({ params }: { params: { slug: string } }) {
    const { slug } = await params;
    const properties = await fetchMarketingProperties();
    const property = properties.find((p) => p.slug === slug);

    if (!property) {
        return new ImageResponse(
            (
                <div
                    style={{
                        fontSize: 48,
                        background: 'white',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'sans-serif',
                    }}
                >
                    Bunks
                </div>
            ),
            { ...size }
        );
    }

    return new ImageResponse(
        (
            <div
                style={{
                    background: 'white',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'serif',
                    position: 'relative',
                }}
            >
                {/* Background Image Layer */}
                {property.image && (
                    <img
                        src={property.image}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            opacity: 0.6,
                        }}
                    />
                )}

                {/* Overlay Content */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0,0,0,0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <div
                        style={{
                            fontSize: 64,
                            color: 'white',
                            textAlign: 'center',
                            marginBottom: 20,
                            padding: '0 40px',
                            fontWeight: 'bold',
                        }}
                    >
                        {property.name}
                    </div>

                    <div
                        style={{
                            fontSize: 32,
                            color: '#e2e8f0',
                            textTransform: 'uppercase',
                            letterSpacing: '0.2em',
                        }}
                    >
                        {property.location}
                    </div>
                </div>

                {/* Brand */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 40,
                        right: 40,
                        fontSize: 24,
                        color: 'white',
                        fontWeight: 'bold',
                    }}
                >
                    BUNKS
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
