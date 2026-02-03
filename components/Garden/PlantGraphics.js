import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Rect, Polygon } from 'react-native-svg';

// Rose - Classic red rose with stem and leaves
export const RoseGraphic = ({ size = 80 }) => {
    const scale = size / 80;
    return (
        <Svg width={size} height={size * 1.4} viewBox="0 0 80 112">
            {/* Stem */}
            <Path
                d="M40 112 L40 55"
                stroke="#2E7D32"
                strokeWidth={4}
                strokeLinecap="round"
            />
            {/* Left leaf */}
            <G transform="translate(20, 78) rotate(-30)">
                <Ellipse cx="0" cy="0" rx="10" ry="6" fill="#4CAF50" />
                <Path d="M-8 0 L8 0" stroke="#2E7D32" strokeWidth={1} />
            </G>
            {/* Right leaf */}
            <G transform="translate(60, 85) rotate(30)">
                <Ellipse cx="0" cy="0" rx="10" ry="6" fill="#4CAF50" />
                <Path d="M-8 0 L8 0" stroke="#2E7D32" strokeWidth={1} />
            </G>
            {/* Rose petals - outer layer */}
            <Circle cx="40" cy="35" r="22" fill="#E91E63" />
            <Circle cx="28" cy="30" r="14" fill="#EC407A" />
            <Circle cx="52" cy="30" r="14" fill="#EC407A" />
            <Circle cx="32" cy="42" r="12" fill="#EC407A" />
            <Circle cx="48" cy="42" r="12" fill="#EC407A" />
            {/* Rose petals - inner layer */}
            <Circle cx="40" cy="32" r="12" fill="#F48FB1" />
            <Circle cx="35" cy="36" r="8" fill="#F8BBD9" />
            <Circle cx="45" cy="36" r="8" fill="#F8BBD9" />
            {/* Center swirl */}
            <Circle cx="40" cy="34" r="5" fill="#AD1457" />
            <Path
                d="M38 34 Q40 30 42 34 Q40 38 38 34"
                fill="#880E4F"
            />
        </Svg>
    );
};

// Lavender - Purple flower spikes with stem
export const LavenderGraphic = ({ size = 80 }) => {
    return (
        <Svg width={size} height={size * 1.4} viewBox="0 0 80 112">
            {/* Main stem */}
            <Path
                d="M40 112 L40 40"
                stroke="#558B2F"
                strokeWidth={3}
                strokeLinecap="round"
            />
            {/* Left stem */}
            <Path
                d="M40 80 Q25 60 25 45"
                stroke="#558B2F"
                strokeWidth={2}
                strokeLinecap="round"
                fill="none"
            />
            {/* Right stem */}
            <Path
                d="M40 75 Q55 55 55 42"
                stroke="#558B2F"
                strokeWidth={2}
                strokeLinecap="round"
                fill="none"
            />
            {/* Leaves */}
            <Ellipse cx="30" cy="90" rx="12" ry="4" fill="#7CB342" transform="rotate(-20 30 90)" />
            <Ellipse cx="50" cy="95" rx="12" ry="4" fill="#7CB342" transform="rotate(20 50 95)" />
            {/* Left flower spike */}
            {[0, 7, 14, 21].map((offset, i) => (
                <G key={`left-${i}`}>
                    <Ellipse cx="25" cy={45 - offset} rx="5" ry="4" fill="#7E57C2" />
                    <Ellipse cx="23" cy={48 - offset} rx="4" ry="3" fill="#9575CD" />
                </G>
            ))}
            {/* Center flower spike */}
            {[0, 7, 14, 21, 28].map((offset, i) => (
                <G key={`center-${i}`}>
                    <Ellipse cx="40" cy={40 - offset} rx="6" ry="4" fill="#7E57C2" />
                    <Ellipse cx="38" cy={43 - offset} rx="5" ry="3" fill="#9575CD" />
                </G>
            ))}
            {/* Right flower spike */}
            {[0, 7, 14, 21].map((offset, i) => (
                <G key={`right-${i}`}>
                    <Ellipse cx="55" cy={42 - offset} rx="5" ry="4" fill="#7E57C2" />
                    <Ellipse cx="57" cy={45 - offset} rx="4" ry="3" fill="#9575CD" />
                </G>
            ))}
        </Svg>
    );
};

// Sunflower - Bright yellow with brown center
export const SunflowerGraphic = ({ size = 80 }) => {
    const petals = 12;
    return (
        <Svg width={size} height={size * 1.4} viewBox="0 0 80 112">
            {/* Stem */}
            <Path
                d="M40 112 L40 50"
                stroke="#33691E"
                strokeWidth={5}
                strokeLinecap="round"
            />
            {/* Large leaves */}
            <G transform="translate(25, 75) rotate(-45)">
                <Ellipse cx="0" cy="0" rx="18" ry="10" fill="#558B2F" />
                <Path d="M-15 0 L15 0" stroke="#33691E" strokeWidth={1.5} />
                <Path d="M-10 -4 L10 4" stroke="#33691E" strokeWidth={0.8} />
                <Path d="M-10 4 L10 -4" stroke="#33691E" strokeWidth={0.8} />
            </G>
            <G transform="translate(55, 80) rotate(45)">
                <Ellipse cx="0" cy="0" rx="18" ry="10" fill="#558B2F" />
                <Path d="M-15 0 L15 0" stroke="#33691E" strokeWidth={1.5} />
                <Path d="M-10 -4 L10 4" stroke="#33691E" strokeWidth={0.8} />
                <Path d="M-10 4 L10 -4" stroke="#33691E" strokeWidth={0.8} />
            </G>
            {/* Petals */}
            {Array.from({ length: petals }).map((_, i) => {
                const angle = (i * 360) / petals;
                return (
                    <G key={i} transform={`translate(40, 30) rotate(${angle})`}>
                        <Ellipse cy={-20} rx="7" ry="14" fill="#FFC107" />
                        <Ellipse cy={-18} rx="5" ry="10" fill="#FFD54F" />
                    </G>
                );
            })}
            {/* Center */}
            <Circle cx="40" cy="30" r="14" fill="#5D4037" />
            <Circle cx="40" cy="30" r="11" fill="#6D4C41" />
            {/* Center seed pattern */}
            {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                <Circle
                    key={i}
                    cx={40 + 5 * Math.cos((angle * Math.PI) / 180)}
                    cy={30 + 5 * Math.sin((angle * Math.PI) / 180)}
                    r="2"
                    fill="#4E342E"
                />
            ))}
            <Circle cx="40" cy="30" r="3" fill="#4E342E" />
        </Svg>
    );
};

// Oak Tree - Small tree with trunk and leafy crown
export const OakTreeGraphic = ({ size = 80 }) => {
    return (
        <Svg width={size} height={size * 1.4} viewBox="0 0 80 112">
            {/* Trunk */}
            <Rect x="34" y="65" width="12" height="47" rx="2" fill="#5D4037" />
            <Rect x="36" y="70" width="3" height="35" fill="#4E342E" />
            {/* Trunk texture lines */}
            <Path d="M35 75 L45 77" stroke="#4E342E" strokeWidth={0.8} />
            <Path d="M35 85 L45 83" stroke="#4E342E" strokeWidth={0.8} />
            <Path d="M35 95 L45 97" stroke="#4E342E" strokeWidth={0.8} />
            {/* Left branch */}
            <Path
                d="M34 70 Q20 60 15 50"
                stroke="#5D4037"
                strokeWidth={4}
                strokeLinecap="round"
                fill="none"
            />
            {/* Right branch */}
            <Path
                d="M46 70 Q60 60 65 50"
                stroke="#5D4037"
                strokeWidth={4}
                strokeLinecap="round"
                fill="none"
            />
            {/* Foliage - multiple overlapping circles for depth */}
            <Circle cx="40" cy="35" r="24" fill="#388E3C" />
            <Circle cx="22" cy="40" r="16" fill="#43A047" />
            <Circle cx="58" cy="40" r="16" fill="#43A047" />
            <Circle cx="40" cy="20" r="18" fill="#4CAF50" />
            <Circle cx="28" cy="28" r="14" fill="#66BB6A" />
            <Circle cx="52" cy="28" r="14" fill="#66BB6A" />
            <Circle cx="15" cy="45" r="12" fill="#388E3C" />
            <Circle cx="65" cy="45" r="12" fill="#388E3C" />
            {/* Highlight spots */}
            <Circle cx="35" cy="18" r="6" fill="#81C784" />
            <Circle cx="50" cy="25" r="5" fill="#81C784" />
            <Circle cx="25" cy="35" r="4" fill="#81C784" />
        </Svg>
    );
};

// Generic flower fallback
export const GenericFlowerGraphic = ({ size = 80, color = '#F48FB1' }) => {
    return (
        <Svg width={size} height={size * 1.4} viewBox="0 0 80 112">
            {/* Stem */}
            <Path
                d="M40 112 L40 50"
                stroke="#4CAF50"
                strokeWidth={4}
                strokeLinecap="round"
            />
            {/* Leaves */}
            <Ellipse cx="30" cy="80" rx="12" ry="6" fill="#66BB6A" transform="rotate(-30 30 80)" />
            <Ellipse cx="50" cy="85" rx="12" ry="6" fill="#66BB6A" transform="rotate(30 50 85)" />
            {/* Petals */}
            {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                <G key={i} transform={`translate(40, 32) rotate(${angle})`}>
                    <Ellipse cy={-16} rx="10" ry="14" fill={color} />
                </G>
            ))}
            {/* Center */}
            <Circle cx="40" cy="32" r="10" fill="#FFC107" />
            <Circle cx="40" cy="32" r="6" fill="#FF9800" />
        </Svg>
    );
};

// Map plant names to their graphics
export const getPlantGraphic = (plantName, size = 80) => {
    const name = plantName?.toLowerCase() || '';

    if (name.includes('rose')) {
        return <RoseGraphic size={size} />;
    } else if (name.includes('lavender')) {
        return <LavenderGraphic size={size} />;
    } else if (name.includes('sunflower')) {
        return <SunflowerGraphic size={size} />;
    } else if (name.includes('oak') || name.includes('tree')) {
        return <OakTreeGraphic size={size} />;
    } else {
        return <GenericFlowerGraphic size={size} />;
    }
};
