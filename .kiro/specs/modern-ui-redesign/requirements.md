# Requirements Document

## Introduction

This specification defines the redesign of the Flash.Mob mobile application's user interface to follow Apple's design principles: clean, minimal, functional, with excellent space utilization. The redesign will remove all emoji-based UI elements, implement a professional icon system, create a compact header, redesign the tab navigation for full-width utilization, and optimize spacing throughout the application.

## Glossary

- **Application**: The Flash.Mob mobile application built with React Native and Expo
- **Header**: The top navigation bar component displayed on each screen
- **Tab Bar**: The bottom navigation component allowing users to switch between main screens
- **Icon System**: A centralized component for rendering consistent icons throughout the application
- **Design Tokens**: Centralized constants for spacing, typography, colors, and other design values
- **Safe Area**: The area of the screen that is not obscured by device notches, rounded corners, or system UI
- **Compact Header**: A reduced-height header component (60px) that maximizes content area
- **Map View**: The main screen showing game locations on an interactive map
- **Viewport**: The visible area of the map or screen content

## Requirements

### Requirement 1

**User Story:** As a user, I want a clean and professional interface without emojis, so that the app feels polished and accessible.

#### Acceptance Criteria

1. WHEN the application renders any screen THEN the system SHALL display icons or text instead of emoji characters
2. WHEN displaying game types or categories THEN the system SHALL use icon components with consistent styling
3. WHEN showing status indicators THEN the system SHALL use icon-based visual feedback
4. WHEN rendering action buttons THEN the system SHALL use icon components for visual representation
5. WHEN displaying achievements or badges THEN the system SHALL use icon-based designs without emoji characters

### Requirement 2

**User Story:** As a user, I want a compact header that maximizes screen space, so that I can see more content on each screen.

#### Acceptance Criteria

1. WHEN any screen loads THEN the system SHALL render a header with a maximum height of 60 pixels
2. WHEN the header displays THEN the system SHALL show the app logo on the left, screen title in center, and contextual information on the right
3. WHEN the user scrolls content THEN the system SHALL maintain the header in a fixed position
4. WHEN displaying the header THEN the system SHALL use a blur background effect for visual depth
5. WHEN the header renders THEN the system SHALL respect device safe area insets

### Requirement 3

**User Story:** As a user, I want a full-width tab bar at the bottom, so that navigation targets are easy to reach and visually balanced.

#### Acceptance Criteria

1. WHEN the tab bar renders THEN the system SHALL span the full width of the screen
2. WHEN displaying tabs THEN the system SHALL divide the width equally among all tab items
3. WHEN a tab is active THEN the system SHALL provide clear visual feedback with an indicator
4. WHEN the user taps a tab THEN the system SHALL provide haptic feedback
5. WHEN the tab bar displays THEN the system SHALL show an icon above the label for each tab

### Requirement 4

**User Story:** As a user, I want consistent spacing and typography throughout the app, so that the interface feels cohesive and professional.

#### Acceptance Criteria

1. WHEN rendering any UI component THEN the system SHALL use spacing values from the design token system
2. WHEN displaying text THEN the system SHALL use typography scales from the design token system
3. WHEN applying colors THEN the system SHALL use color values from the design token system
4. WHEN creating new components THEN the system SHALL reference design tokens instead of hardcoded values
5. WHEN updating design values THEN the system SHALL propagate changes through the token system

### Requirement 5

**User Story:** As a user, I want the map screen to show more map area, so that I can see more game locations at once.

#### Acceptance Criteria

1. WHEN the map screen loads THEN the system SHALL display at least 40 pixels more vertical map area compared to the previous design
2. WHEN the header renders on the map screen THEN the system SHALL use the compact 60-pixel height
3. WHEN the tab bar displays THEN the system SHALL not overlap the map content
4. WHEN game markers render THEN the system SHALL display them with icon-based badges
5. WHEN the game counter displays THEN the system SHALL position it in a corner without obscuring map content

### Requirement 6

**User Story:** As a user, I want compact and efficient card designs, so that I can see more information without excessive scrolling.

#### Acceptance Criteria

1. WHEN rendering cards THEN the system SHALL reduce padding by 20 percent compared to the previous design
2. WHEN displaying card content THEN the system SHALL use tighter line heights for improved density
3. WHEN showing lists THEN the system SHALL reduce spacing between items by 25 percent
4. WHEN rendering sections THEN the system SHALL use consistent reduced spacing
5. WHEN displaying information THEN the system SHALL prioritize content over decorative elements

### Requirement 7

**User Story:** As a user, I want proper icons for all actions and states, so that the interface is clear and accessible.

#### Acceptance Criteria

1. WHEN displaying navigation actions THEN the system SHALL use SF Symbols or vector icons
2. WHEN showing transaction types THEN the system SHALL use directional arrow icons
3. WHEN indicating status THEN the system SHALL use appropriate status icons
4. WHEN displaying game types THEN the system SHALL use consistent icon representations
5. WHEN rendering achievements THEN the system SHALL use icon-based visual indicators

### Requirement 8

**User Story:** As a user, I want the wallet screen to display information efficiently, so that I can quickly understand my balance and transactions.

#### Acceptance Criteria

1. WHEN the wallet screen loads THEN the system SHALL display the compact header
2. WHEN showing action buttons THEN the system SHALL use icon components instead of emoji
3. WHEN displaying transactions THEN the system SHALL use icon-based type indicators
4. WHEN rendering balance cards THEN the system SHALL use reduced padding for better space utilization
5. WHEN showing statistics THEN the system SHALL use compact card layouts

### Requirement 9

**User Story:** As a user, I want the profile screen to show leaderboard and stats clearly, so that I can track my progress efficiently.

#### Acceptance Criteria

1. WHEN the profile screen loads THEN the system SHALL display the compact header
2. WHEN showing the podium THEN the system SHALL use rank numbers with colored backgrounds instead of emoji medals
3. WHEN displaying achievements THEN the system SHALL use icon-based representations
4. WHEN rendering game statistics THEN the system SHALL use icon components for game types
5. WHEN showing tabs THEN the system SHALL use text-only labels without emoji prefixes

### Requirement 10

**User Story:** As a developer, I want a centralized icon system, so that icons are consistent and easy to maintain.

#### Acceptance Criteria

1. WHEN creating the icon component THEN the system SHALL accept name, size, and color as properties
2. WHEN rendering an icon THEN the system SHALL map the name to the appropriate icon source
3. WHEN an icon is not found THEN the system SHALL provide a fallback representation
4. WHEN using icons THEN the system SHALL support both SF Symbols and vector icon libraries
5. WHEN styling icons THEN the system SHALL apply consistent sizing and color properties

### Requirement 11

**User Story:** As a developer, I want design tokens for all design values, so that the design system is maintainable and consistent.

#### Acceptance Criteria

1. WHEN defining spacing THEN the system SHALL provide a scale from extra-small to extra-extra-large
2. WHEN defining typography THEN the system SHALL provide scales for all text hierarchy levels
3. WHEN defining colors THEN the system SHALL provide semantic color names for all use cases
4. WHEN defining border radius THEN the system SHALL provide consistent values for all components
5. WHEN defining shadows THEN the system SHALL provide elevation levels for depth hierarchy

### Requirement 12

**User Story:** As a user, I want smooth transitions and animations, so that the interface feels responsive and polished.

#### Acceptance Criteria

1. WHEN switching tabs THEN the system SHALL animate the active indicator smoothly
2. WHEN pressing interactive elements THEN the system SHALL provide immediate visual feedback
3. WHEN loading content THEN the system SHALL display smooth loading states
4. WHEN showing modals THEN the system SHALL use fade and slide animations
5. WHEN updating UI state THEN the system SHALL animate changes with appropriate timing curves
