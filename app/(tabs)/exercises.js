import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Modal } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { PlayCircle, Clock, Target, ChevronDown, ChevronUp, CheckCircle, Circle, Plus, Edit, Trash2, Info, X } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { SupabaseService } from '../../services/SupabaseService';
import { MedicalStaffService } from '../../services/MedicalStaffService';
import { CustomExerciseModal } from '../../components/CustomExerciseModal';
import { ConfettiBurst } from '../../components/ConfettiBurst';
import { getRecommendedExercises } from '../../services/RecommendationService';
import { ExerciseVisualGuide, getExerciseHasVisualGuide } from '../../components/ExerciseVisualGuide';

const CATEGORIES = ['All', 'Arms', 'Legs', 'Core', 'Hands', 'Head & Neck'];
const MODE_TYPES = ['All', 'Solo', 'Partner'];
const RECOMMENDATION_FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'ai_recommended', label: 'AI recommended' },
    { value: 'staff_assigned', label: 'Staff assigned' },
];

export const EXERCISES_DATA = [
    // Arms & Shoulders
    {
        id: 'a1',
        category: 'Arms',
        mode: 'solo', // Can do independently
        title: 'Shoulder Shrugs',
        time: '3 min',
        target: 'Upper Traps',
        description: 'Simple movement to release tension and improve shoulder mobility.',
        difficulty: 'Beginner',
        thumbnailColor: '#E0F2FE',
        instructions: [
            'Sit up straight with your feet flat on the floor.',
            'Lift your shoulders up towards your ears.',
            'Hold for 2-3 seconds.',
            'Relax and lower them back down.',
            'Repeat 10 times.'
        ]
    },
    {
        id: 'a2',
        category: 'Arms',
        mode: 'partner', // Benefits from partner assistance for guiding arm movement
        title: 'Table Push',
        time: '5 min',
        target: 'Shoulder/Elbow',
        description: 'Sliding exercise to improve reaching ability and arm extension.',
        difficulty: 'Beginner',
        thumbnailColor: '#BAE6FD',
        instructions: [
            'Sit at a table with a towel under your affected hand.',
            'Interlace your fingers or place your strong hand over the affected one.',
            'Slide your hands forward across the table, straightening your elbows.',
            'Lean forward slightly if needed.',
            'Slide back to the starting position.'
        ]
    },
    {
        id: 'a3',
        category: 'Arms',
        mode: 'solo', // Can do independently
        title: 'Bicep Curls',
        time: '5 min',
        target: 'Biceps',
        description: 'Strengthening exercise for the front of the upper arm.',
        difficulty: 'Intermediate',
        thumbnailColor: '#7DD3FC',
        instructions: [
            'Sit or stand with your arm at your side.',
            'Hold a light weight or water bottle (optional).',
            'Slowly bend your elbow, bringing your hand toward your shoulder.',
            'Slowly lower it back down.',
            'Keep your elbow tucked close to your side.'
        ]
    },

    // Legs & Mobility
    {
        id: 'l1',
        category: 'Legs',
        mode: 'solo', // Can do independently
        title: 'Ankle Pumps',
        time: '3 min',
        target: 'Calves/Shins',
        description: 'Essential for circulation and preventing foot drop.',
        difficulty: 'Beginner',
        thumbnailColor: '#FED7AA',
        instructions: [
            'Sit or lie down with your legs straight.',
            'Pull your toes up towards your nose.',
            'Point your toes down away from you.',
            'Repeat in a rhythmic motion.',
            'Do this for 1-2 minutes.'
        ]
    },
    {
        id: 'l2',
        category: 'Legs',
        mode: 'solo', // Can do independently
        title: 'Seated Marching',
        time: '5 min',
        target: 'Hip Flexors',
        description: 'Improves hip strength and ability to lift legs for walking.',
        difficulty: 'Beginner',
        thumbnailColor: '#FDBA74',
        instructions: [
            'Sit upright in a chair.',
            'Lift one knee up towards your chest as high as comfortable.',
            'Lower it slowly.',
            'Switch to the other leg.',
            'Alternate for 20 repetitions.'
        ]
    },
    {
        id: 'l3',
        category: 'Legs',
        mode: 'partner', // Benefits from partner spotting for safety
        title: 'Sit-to-Stand',
        time: '8 min',
        target: 'Full Leg',
        description: 'Functional exercise to build strength for getting out of chairs.',
        difficulty: 'Intermediate',
        thumbnailColor: '#FB923C',
        instructions: [
            'Sit at the edge of a sturdy chair.',
            'Lean forward slightly ("nose over toes").',
            'Push through your heels to stand up fully.',
            'Slowly lower yourself back down to the chair.',
            'Use your hands for support only if needed.'
        ]
    },

    // Core & Balance
    {
        id: 'c1',
        category: 'Core',
        mode: 'solo', // Can do independently
        title: 'Trunk Rotations',
        time: '4 min',
        target: 'Obliques',
        description: 'Improves spinal mobility and ability to look around.',
        difficulty: 'Beginner',
        thumbnailColor: '#D1FAE5',
        instructions: [
            'Sit tall in a chair, feet flat.',
            'Place your right hand on your left thigh.',
            'Gently twist your upper body to the left.',
            'Hold for 5 seconds.',
            'Return to center and repeat on the other side.'
        ]
    },
    {
        id: 'c2',
        category: 'Core',
        mode: 'partner', // Partner can help guide the stretch
        title: 'Lateral Flexion',
        time: '4 min',
        target: 'Side Core',
        description: 'Helps with balance and stability while sitting or standing.',
        difficulty: 'Beginner',
        thumbnailColor: '#A7F3D0',
        instructions: [
            'Sit tall with arms at your sides.',
            'Slowly lean to the right, reaching your hand towards the floor.',
            'Keep your buttocks firmly on the chair.',
            'Return to upright.',
            'Repeat on the left side.'
        ]
    },
    {
        id: 'c3',
        category: 'Core',
        mode: 'partner', // Benefits from partner for safety during balance work
        title: 'Seated Balance',
        time: '5 min',
        target: 'Core Stabilizers',
        description: 'Challenges your ability to maintain posture while moving.',
        difficulty: 'Intermediate',
        thumbnailColor: '#6EE7B7',
        instructions: [
            'Sit on a possibly unstable surface (like a cushion) or just sit tall.',
            'Shift your weight side to side without using hands.',
            'Shift your weight forward and backward.',
            'Try to lift one foot slightly while maintaining balance.'
        ]
    },

    // Hands & Fine Motor
    {
        id: 'h1',
        category: 'Hands',
        mode: 'solo', // Can do independently
        title: 'Fist Clenches',
        time: '3 min',
        target: 'Hand Grip',
        description: 'Basic strengthening for hand opening and closing.',
        difficulty: 'Beginner',
        thumbnailColor: '#E9D5FF',
        instructions: [
            'Rest your arm on a table.',
            'Squeeze your hand into a gentle fist.',
            'Hold for 3 seconds.',
            'Open your hand and spread your fingers wide.',
            'Repeat 10 times.'
        ]
    },
    {
        id: 'h2',
        category: 'Hands',
        mode: 'partner', // Partner can assist with passive stretching
        title: 'Towel Scrunch',
        time: '5 min',
        target: 'Finger Dexterity',
        description: 'Improves fine motor control and finger strength.',
        difficulty: 'Intermediate',
        thumbnailColor: '#D8B4FE',
        instructions: [
            'Place a small hand towel flat on the table.',
            'Place your hand palm down on the towel.',
            'Use your fingers to scrunch the towel into your palm.',
            'Release and straighten the towel out.',
            'Repeat.'
        ]
    },
    {
        id: 'h3',
        category: 'Hands',
        mode: 'solo', // Can do independently
        title: 'Thumb Touch',
        time: '4 min',
        target: 'Coordination',
        description: 'Enhances precision and coordination of the fingers.',
        difficulty: 'Advanced',
        thumbnailColor: '#C084FC',
        instructions: [
            'Hold your hand up comfortably.',
            'Touch the tip of your thumb to the tip of your index finger.',
            'Open.',
            'Touch thumb to middle finger, then ring, then pinky.',
            'Repeat the sequence.'
        ]
    },

    // Head & Neck (TMJ / cervical)
    {
        id: 'n1',
        category: 'Head & Neck',
        mode: 'solo',
        title: 'Tongue Clucking',
        time: '2 min',
        target: 'TMJ / Breathing',
        description: 'Positions tongue on hard palate for proper nasal and diaphragmatic breathing.',
        difficulty: 'Beginner',
        thumbnailColor: '#FFE4E6',
        instructions: [
            'Make a gentle "clucking" sound with your tongue against the roof of your mouth.',
            'This positions your tongue in the correct resting position.',
            'Practice 6 times per session, 6 sessions per day.',
            'Aim to maintain this tongue position during normal activity.'
        ]
    },
    {
        id: 'n2',
        category: 'Head & Neck',
        mode: 'solo',
        title: 'Controlled TMJ Rotation',
        time: '3 min',
        target: 'TMJ',
        description: 'Maintain tongue on palate while opening and closing jaw; limits opening to rotation only.',
        difficulty: 'Beginner',
        thumbnailColor: '#FECDD3',
        instructions: [
            'Keep your tongue on the hard palate.',
            'Slowly open your jaw while maintaining tongue position.',
            'Close your jaw slowly.',
            'This limits opening to rotational movement and prevents excessive protrusion.',
            'Repeat 6 times per session, 6 sessions per day.'
        ]
    },
    {
        id: 'n3',
        category: 'Head & Neck',
        mode: 'solo',
        title: 'Mandibular Rhythmic Stabilization',
        time: '3 min',
        target: 'TMJ',
        description: 'Apply resistance to opening, closing, and lateral deviation with jaw in resting position.',
        difficulty: 'Intermediate',
        thumbnailColor: '#FDA4AF',
        instructions: [
            'Place your jaw in a resting position.',
            'Apply gentle resistance with your hand to opening movement; hold briefly.',
            'Apply resistance to closing movement; hold briefly.',
            'Apply resistance to lateral (side) deviation; hold briefly.',
            'Goal: promote normal jaw positioning while maintaining postural alignment.'
        ]
    },
    {
        id: 'n4',
        category: 'Head & Neck',
        mode: 'solo',
        title: 'Upper Cervical Distraction',
        time: '3 min',
        target: 'Upper Cervical',
        description: 'Upper cervical flexion while stabilizing with a hand-collar to relieve neurovascular compression.',
        difficulty: 'Intermediate',
        thumbnailColor: '#FB7185',
        instructions: [
            'Create a "hand-collar" by placing your hands to stabilize your cervical spine.',
            'Perform upper cervical flexion (nodding motion at the top of the neck).',
            'This relieves compression between the occiput and atlas.',
            'Move slowly and hold briefly. Repeat as directed.'
        ]
    },
    {
        id: 'n5',
        category: 'Head & Neck',
        mode: 'solo',
        title: 'Chin Tuck (Axial Extension)',
        time: '3 min',
        target: 'Cervical Spine',
        description: 'Cervical retraction to normalize forward head posture.',
        difficulty: 'Beginner',
        thumbnailColor: '#FFE4E6',
        instructions: [
            'Sit or stand with good posture.',
            'Draw your chin straight back (retraction) without tilting your head up or down.',
            'You should feel a stretch at the base of your skull.',
            'Hold 3-5 seconds, then relax. Repeat 10 times.'
        ]
    },
    {
        id: 'n6',
        category: 'Head & Neck',
        mode: 'solo',
        title: 'Chin Nods',
        time: '3 min',
        target: 'Jaw / Upper Cervical',
        description: 'Cervical retraction in trunk-flexed position to maintain normal jaw and upper cervical alignment.',
        difficulty: 'Beginner',
        thumbnailColor: '#FECDD3',
        instructions: [
            'Sit with your trunk slightly flexed (leaning forward).',
            'Perform a gentle chin nod (cervical retraction).',
            'Maintain normal jaw and upper cervical alignment throughout.',
            'Repeat 10 times.'
        ]
    },
    {
        id: 'n7',
        category: 'Head & Neck',
        mode: 'solo',
        title: 'Nasal Breathing Practice',
        time: '3 min',
        target: 'Jaw Rest Position',
        description: 'Practice tongue on palate, lips closed, teeth slightly apart; maintains normal resting jaw position.',
        difficulty: 'Beginner',
        thumbnailColor: '#FDA4AF',
        instructions: [
            'Rest your tongue gently on the hard palate.',
            'Keep your lips closed and teeth slightly apart.',
            'Breathe in and out through your nose.',
            'Maintain this resting jaw position during the exercise.',
            'Practice for a few minutes several times a day.'
        ]
    },

    // Arms (continued)
    {
        id: 'a4',
        category: 'Arms',
        mode: 'solo',
        title: 'PROM Shoulder External Rotation',
        time: '5 min',
        target: 'Shoulder',
        description: 'Self-assisted shoulder external rotation to improve range of motion.',
        difficulty: 'Beginner',
        thumbnailColor: '#E0F2FE',
        instructions: [
            'Hold the wrist of your involved arm with your other hand.',
            'Keep the elbow of the involved arm bent and next to your side.',
            'Move your forearm outward and away from your body.',
            'Return to start and repeat. Perform 3 sets of 10 reps, three times a day.'
        ]
    },
    {
        id: 'a5',
        category: 'Arms',
        mode: 'solo',
        title: 'PROM Shoulder Flexion (Self)',
        time: '5 min',
        target: 'Shoulder',
        description: 'Self-assisted shoulder flexion; gently raise arm upward and in front.',
        difficulty: 'Beginner',
        thumbnailColor: '#BAE6FD',
        instructions: [
            'Grasp the wrist of your involved arm with your other hand.',
            'Gently raise your arm upward and in front through available range.',
            'Return to start position and repeat.',
            'Perform 3 sets of 10 reps, three times a day.'
        ]
    },
    {
        id: 'a6',
        category: 'Arms',
        mode: 'solo',
        title: 'PROM Shoulder Extension (Self)',
        time: '5 min',
        target: 'Shoulder',
        description: 'Sit with arm at side, elbow bent 90 deg; grasp forearm and gently move arm backward.',
        difficulty: 'Beginner',
        thumbnailColor: '#7DD3FC',
        instructions: [
            'Sit with your involved arm at your side, elbow bent to 90 degrees.',
            'Grasp your wrist or forearm of the involved arm with your other hand.',
            'Gently move the involved arm backward through available range.',
            'Return to start position and repeat. Perform 3 sets of 10 reps, three times a day.'
        ]
    },
    {
        id: 'a7',
        category: 'Arms',
        mode: 'solo',
        title: 'PROM Elbow Flexion/Extension',
        time: '5 min',
        target: 'Elbow',
        description: 'Self-assisted elbow motion through available range.',
        difficulty: 'Beginner',
        thumbnailColor: '#38BDF8',
        instructions: [
            'Begin with your arm straight.',
            'Grasp your arm at the wrist. Use a firm, yet soft grip; do not squeeze over bony areas.',
            'Move your elbow through available range (bend and straighten).',
            'Return to start position. Perform 3 sets of 10 reps, three times a day.'
        ]
    },
    {
        id: 'a8',
        category: 'Arms',
        mode: 'solo',
        title: 'Shoulder Girdle Retraction',
        time: '4 min',
        target: 'Scapulae',
        description: 'Retraction and depression of scapulae to normalize upper quarter posture.',
        difficulty: 'Beginner',
        thumbnailColor: '#0EA5E9',
        instructions: [
            'Sit or stand with good posture.',
            'Squeeze your shoulder blades together and down (retract and depress).',
            'Hold for 3-5 seconds, then relax.',
            'Repeat 10 times.'
        ]
    },
    {
        id: 'a9',
        category: 'Arms',
        mode: 'solo',
        title: 'Seated Push Up',
        time: '4 min',
        target: 'Arms / Trunk',
        description: 'Sitting in a chair, press down with arms to lift body slightly off the seat.',
        difficulty: 'Intermediate',
        thumbnailColor: '#0284C7',
        instructions: [
            'Sit in a sturdy chair with your hands on the armrests or seat beside your thighs.',
            'Press down through your hands and lift your body slightly off the seat.',
            'Hold briefly, then lower slowly.',
            'Repeat 10 times.'
        ]
    },
    {
        id: 'a10',
        category: 'Arms',
        mode: 'partner',
        title: 'PROM Shoulder Abduction (Partner)',
        time: '6 min',
        target: 'Shoulder',
        description: 'Partner moves your arm away from body through available range.',
        difficulty: 'Beginner',
        thumbnailColor: '#E0F2FE',
        instructions: [
            'Lie on your back with your arm at your side and elbow straight.',
            'Your partner grasps your wrist and supports your elbow with their other hand.',
            'Partner gently moves your arm away from your body (abduction) through available range.',
            'Return to side. Do not force past available range. Perform 3 sets of 10 reps, three times a day.'
        ]
    },
    {
        id: 'a11',
        category: 'Arms',
        mode: 'partner',
        title: 'PROM Shoulder Flexion (Partner)',
        time: '6 min',
        target: 'Shoulder',
        description: 'Partner raises and lowers your arm through available range.',
        difficulty: 'Beginner',
        thumbnailColor: '#BAE6FD',
        instructions: [
            'Lie on your back with your arm at your side.',
            'Partner grasps your wrist with one hand and supports your elbow with the other.',
            'Partner gently moves your arm upward and downward through available range.',
            'Use a firm yet soft grip; do not force. Perform 3 sets of 10 reps, three times a day.'
        ]
    },
    {
        id: 'a12',
        category: 'Arms',
        mode: 'partner',
        title: 'PROM Elbow Flex/Ext (Partner)',
        time: '6 min',
        target: 'Elbow',
        description: 'Partner moves your elbow through available range of motion.',
        difficulty: 'Beginner',
        thumbnailColor: '#7DD3FC',
        instructions: [
            'Begin with your arm straight.',
            'Partner places one hand above your elbow and the other at your wrist or hand.',
            'Partner moves your elbow through available range (flexion and extension).',
            'Partner uses a firm yet soft grip; avoid squeezing over bony areas. Perform 3 sets of 10 reps, three times a day.'
        ]
    },
    {
        id: 'a13',
        category: 'Arms',
        mode: 'solo',
        title: 'Resistance Band Chest Press',
        time: '5 min',
        target: 'Pectorals',
        description: 'Using a flat resistance band for pectoral strengthening.',
        difficulty: 'Intermediate',
        thumbnailColor: '#38BDF8',
        instructions: [
            'Sit on the floor with knees bent. Place the band behind your back, just below shoulder blades.',
            'Hold the band with both hands in front of your shoulders, palms facing in.',
            'Press both arms forward, rotating shoulders inward until palms face down.',
            'Keep shoulder blades together. Hold 1-2 seconds, slowly return. Repeat as directed.'
        ]
    },
    {
        id: 'a14',
        category: 'Arms',
        mode: 'solo',
        title: 'Resistance Band Arm Curl',
        time: '5 min',
        target: 'Biceps',
        description: 'Using a flat resistance band for bicep strengthening.',
        difficulty: 'Intermediate',
        thumbnailColor: '#0EA5E9',
        instructions: [
            'Sit on the floor with knees bent. Place the band around your feet (or one foot for more resistance).',
            'Grasp each end of the band, palms facing in, arms extended toward your legs.',
            'Keeping elbows stationary, bend arms and pull hands toward shoulders, turning palms up.',
            'Hold 1-2 seconds, slowly return. Repeat as directed.'
        ]
    },
    {
        id: 'a15',
        category: 'Arms',
        mode: 'solo',
        title: 'Resistance Band Arm Extension',
        time: '5 min',
        target: 'Triceps',
        description: 'Using a flat resistance band for tricep strengthening.',
        difficulty: 'Intermediate',
        thumbnailColor: '#0284C7',
        instructions: [
            'Sit on the floor with knees bent. Hold the band with both hands, arms bent at 90 degrees, elbows at shoulder height, palms down.',
            'Keeping elbows stationary, straighten arms until hands align with shoulders (do not lock elbows).',
            'Hold 1-2 seconds, slowly return. Repeat as directed.'
        ]
    },
    {
        id: 'a16',
        category: 'Arms',
        mode: 'solo',
        title: 'Resistance Band Shoulder Press',
        time: '5 min',
        target: 'Deltoids',
        description: 'Using a flat resistance band for deltoid strengthening.',
        difficulty: 'Intermediate',
        thumbnailColor: '#0369A1',
        instructions: [
            'Sit on the floor with knees bent. Place the band under your buttocks.',
            'Hold the band with both hands just above your shoulders, palms forward, band along inside of upper arms.',
            'Press arms up and back overhead, turning palms toward each other, until arms are over shoulders.',
            'Hold 1-2 seconds, slowly return. Repeat as directed.'
        ]
    },

    // Legs (continued)
    {
        id: 'l4',
        category: 'Legs',
        mode: 'solo',
        title: 'Seated Knee Extensions',
        time: '5 min',
        target: 'Quadriceps',
        description: 'Sit with feet on floor; lift foot until knee is straight and parallel to floor, then slowly lower.',
        difficulty: 'Beginner',
        thumbnailColor: '#FED7AA',
        instructions: [
            'Sit with both feet on the floor.',
            'On the side you wish to exercise, lift your foot off the floor so the knee is straight and parallel to the floor.',
            'Hold for 5 seconds.',
            'Slowly lower your foot back to the floor. Repeat 30 times.'
        ]
    },
    {
        id: 'l5',
        category: 'Legs',
        mode: 'solo',
        title: 'Seated Hip Adduction',
        time: '5 min',
        target: 'Inner Thigh',
        description: 'Sitting with a pillow or ball between knees, gently squeeze and hold.',
        difficulty: 'Beginner',
        thumbnailColor: '#FDBA74',
        instructions: [
            'Sit in a chair with a pillow or ball between your knees.',
            'Gently squeeze your knees together and hold for 5 seconds.',
            'Relax. Repeat 30 times.'
        ]
    },
    {
        id: 'l6',
        category: 'Legs',
        mode: 'solo',
        title: 'Side Stepping on Line',
        time: '5 min',
        target: 'Hips / Balance',
        description: 'Standing upright, step sideways along a line, then return in the opposite direction.',
        difficulty: 'Intermediate',
        thumbnailColor: '#FB923C',
        instructions: [
            'Stand upright with your hands at your sides.',
            'Step sideways along the length of a line on the floor.',
            'When you reach the end, side step in the opposite direction back to the start.',
            'Keep an upright posture and eyes straight ahead.'
        ]
    },
    {
        id: 'l7',
        category: 'Legs',
        mode: 'solo',
        title: 'Marching with Support',
        time: '6 min',
        target: 'Hip Flexors',
        description: 'Standing at a counter or chair for support, raise knees alternately to waist level.',
        difficulty: 'Intermediate',
        thumbnailColor: '#F97316',
        instructions: [
            'Stand in front of a table, counter, or chair for support.',
            'Raise one knee upward to waist level.',
            'Lower and alternate to the other leg.',
            'Keep your abdominals tight and stand upright, looking forward. Repeat 30 times.'
        ]
    },
    {
        id: 'l8',
        category: 'Legs',
        mode: 'solo',
        title: 'Heel Slides',
        time: '5 min',
        target: 'Knee / Hip',
        description: 'Lying on your back, slide your heel up to bend the knee, then slide back down.',
        difficulty: 'Beginner',
        thumbnailColor: '#EA580C',
        instructions: [
            'Lie on your back with legs straight.',
            'Slowly slide one heel up toward your buttocks, bending the knee.',
            'Slide the heel back down to straighten the leg.',
            'Repeat with the other leg. Perform 3 sets of 15 reps, three times a day.'
        ]
    },
    {
        id: 'l9',
        category: 'Legs',
        mode: 'solo',
        title: 'Straight Leg Raise (Supine)',
        time: '6 min',
        target: 'Hip Flexors / Quads',
        description: 'Lying on your back, raise one straight leg upward.',
        difficulty: 'Beginner',
        thumbnailColor: '#FED7AA',
        instructions: [
            'Lie on your back with legs straight.',
            'Tighten your thigh muscle and lift one leg straight up off the surface.',
            'Lower slowly. Repeat with the other leg.',
            'Perform 3 sets of 15 reps, three times a day.'
        ]
    },
    {
        id: 'l10',
        category: 'Legs',
        mode: 'solo',
        title: 'Heel Raises',
        time: '4 min',
        target: 'Calves',
        description: 'Standing, rise up on your toes then lower. Use support if needed.',
        difficulty: 'Beginner',
        thumbnailColor: '#FDBA74',
        instructions: [
            'Stand holding onto a chair or counter for support if needed.',
            'Rise up onto your toes.',
            'Lower your heels back to the floor slowly.',
            'Perform 3 sets of 15 reps, three times a day.'
        ]
    },
    {
        id: 'l11',
        category: 'Legs',
        mode: 'solo',
        title: 'Standing Hamstring Curls',
        time: '5 min',
        target: 'Hamstrings',
        description: 'Standing against support, bend knee to bring heel toward buttock.',
        difficulty: 'Intermediate',
        thumbnailColor: '#FB923C',
        instructions: [
            'Stand holding onto the back of a chair or tall support so your thigh cannot swing forward.',
            'Pop your hip on the standing side; drop the opposite hip and keep it dropped.',
            'Bend your knee so your heel moves toward your buttock.',
            'Lower until your foot touches the floor, then repeat. Do 12 reps, 1 set, once a day.'
        ]
    },
    {
        id: 'l12',
        category: 'Legs',
        mode: 'partner',
        title: 'Prone Hamstring Curls',
        time: '6 min',
        target: 'Hamstrings',
        description: 'Lay on your stomach, flex knee slowly; partner holds pelvis down. 3 sets of 10.',
        difficulty: 'Intermediate',
        thumbnailColor: '#F97316',
        instructions: [
            'Lie on your stomach. Have someone hold your pelvis down to the mat or bed.',
            'Flex your knee, bringing your heel toward your buttock.',
            'Slowly control the movement back to the starting position.',
            'Repeat 10 times. Complete 3 sets, once a day.'
        ]
    },
    {
        id: 'l13',
        category: 'Legs',
        mode: 'solo',
        title: 'Hip Abduction (Supine)',
        time: '6 min',
        target: 'Hip Abductors',
        description: 'Lying on your back, slide one leg out to the side and return.',
        difficulty: 'Beginner',
        thumbnailColor: '#EA580C',
        instructions: [
            'Lie on your back with legs straight.',
            'Slide one leg out to the side (abduction), then slide it back to center.',
            'Keep the other leg still. Perform 3 sets of 15 reps, three times a day.'
        ]
    },
    {
        id: 'l14',
        category: 'Legs',
        mode: 'solo',
        title: 'Hip Abduction (Standing)',
        time: '5 min',
        target: 'Hip Abductors',
        description: 'Standing and holding support, lift one leg sideways.',
        difficulty: 'Intermediate',
        thumbnailColor: '#FED7AA',
        instructions: [
            'Stand straight holding onto a support (e.g., chair back).',
            'Lift one leg sideways and bring it back, keeping your trunk straight.',
            'Repeat on the other side. Perform 3 sets of 15 reps, three times a day.'
        ]
    },
    {
        id: 'l15',
        category: 'Legs',
        mode: 'solo',
        title: 'Hip Extension (Standing)',
        time: '4 min',
        target: 'Glutes / Hamstrings',
        description: 'Standing and holding support, bring one leg slightly backward.',
        difficulty: 'Beginner',
        thumbnailColor: '#FDBA74',
        instructions: [
            'Stand holding onto a support.',
            'Bring one leg slightly backward, keeping your trunk straight.',
            'Return to standing. Repeat on the other side.'
        ]
    },
    {
        id: 'l16',
        category: 'Legs',
        mode: 'solo',
        title: 'Partial Squats',
        time: '6 min',
        target: 'Quads / Glutes',
        description: 'Standing, perform a partial (mini) squat.',
        difficulty: 'Intermediate',
        thumbnailColor: '#FB923C',
        instructions: [
            'Stand with feet shoulder-width apart, holding a support if needed.',
            'Bend your knees and lower your body into a partial squat (do not go too deep).',
            'Push back up to standing. Perform 3 sets of 15 reps, three times a day.'
        ]
    },
    {
        id: 'l17',
        category: 'Legs',
        mode: 'solo',
        title: 'Forward Lunges',
        time: '6 min',
        target: 'Full Leg',
        description: 'Step forward into a lunge position. 3 sets of 15 reps.',
        difficulty: 'Advanced',
        thumbnailColor: '#F97316',
        instructions: [
            'Stand with feet hip-width apart.',
            'Step one leg forward and lower your back knee toward the floor (lunge position).',
            'Push back to standing. Alternate legs. Perform 3 sets of 15 reps, three times a day.'
        ]
    },
    {
        id: 'l18',
        category: 'Legs',
        mode: 'partner',
        title: 'Assisted Dorsiflexion Stretch',
        time: '5 min',
        target: 'Calf / Ankle',
        description: 'Partner pulls your foot up while supporting your leg to stretch calf muscles.',
        difficulty: 'Beginner',
        thumbnailColor: '#EA580C',
        instructions: [
            'Lie on your back. Your partner places your heel in their hand, foot against their forearm.',
            'Partner straightens your hip and knee, then slowly pulls your heel up, moving toes toward you.',
            'Support your leg with the opposite hand. Hold the stretch 30 seconds. Repeat 3 times, once a day.'
        ]
    },
    {
        id: 'l19',
        category: 'Legs',
        mode: 'partner',
        title: 'Hamstring Stretch (Assisted)',
        time: '5 min',
        target: 'Hamstrings',
        description: 'Lay flat; partner bends leg to 90 deg and pushes lower leg upward. Hold 30 sec.',
        difficulty: 'Beginner',
        thumbnailColor: '#FED7AA',
        instructions: [
            'Lie flat on your back.',
            'Partner bends one leg up to 90 degrees, then pushes the lower leg upward to straighten the leg.',
            'You should feel the stretch on the underside of your thigh. Hold 30 seconds.',
            'Repeat 3 times, once a day.'
        ]
    },
    {
        id: 'l20',
        category: 'Legs',
        mode: 'partner',
        title: 'Retro Gait',
        time: '5 min',
        target: 'Gait / Balance',
        description: 'Walk backwards, leading with toe then rolling to flat foot. Keep body upright, bend knee.',
        difficulty: 'Intermediate',
        thumbnailColor: '#FDBA74',
        instructions: [
            'Walk backwards, leading with your toe touching the floor first.',
            'Then roll to a flat foot.',
            'Keep your body upright and bend your knee as you step.'
        ]
    },
    {
        id: 'l21',
        category: 'Legs',
        mode: 'solo',
        title: 'Walk on Toes',
        time: '4 min',
        target: 'Calves / Balance',
        description: 'Stand and walk forward on your toes.',
        difficulty: 'Intermediate',
        thumbnailColor: '#FB923C',
        instructions: [
            'Stand tall. Walk forward on your toes for the prescribed time or distance.',
            'Use a wall or support nearby if needed for balance.'
        ]
    },
    {
        id: 'l22',
        category: 'Legs',
        mode: 'solo',
        title: 'Walk on Heels',
        time: '4 min',
        target: 'Shins / Balance',
        description: 'Stand and walk forward on your heels.',
        difficulty: 'Intermediate',
        thumbnailColor: '#F97316',
        instructions: [
            'Stand tall. Walk forward on your heels for the prescribed time or distance.',
            'Use a wall or support nearby if needed for balance.'
        ]
    },
    {
        id: 'l23',
        category: 'Legs',
        mode: 'solo',
        title: 'Stair Walking',
        time: '6 min',
        target: 'Full Leg / Balance',
        description: 'Walk up and down stairs with proper form.',
        difficulty: 'Intermediate',
        thumbnailColor: '#EA580C',
        instructions: [
            'Stand at the bottom of a flight of stairs.',
            'Walk up and down the stairs, placing your whole foot on each step.',
            'Use the railing for support if needed. Repeat as prescribed.'
        ]
    },
    {
        id: 'l24',
        category: 'Legs',
        mode: 'partner',
        title: 'Gait Training with Cane',
        time: '10 min',
        target: 'Gait / Balance',
        description: 'Practice walking phases with a cane: heel strike, loading response, midstance. Focus on pelvic tuck and weight shifting.',
        difficulty: 'Advanced',
        thumbnailColor: '#C2410C',
        instructions: [
            'Take a long step with one leg, landing on your heel first.',
            'Loading response: tuck your pelvis and shift weight onto that leg; stand tall; let the other knee bend but do not step yet.',
            'Midstance: continue scoop and pelvic motion; relax the swing leg so the knee bends (heel toward buttock); move the cane forward; stand tall; keep the non-weight-bearing hip dropped.',
            'Repeat on the other side. Practice with your therapist or partner for safety.'
        ]
    },

    // Core (continued)
    {
        id: 'c4',
        category: 'Core',
        mode: 'solo',
        title: 'Bridging',
        time: '5 min',
        target: 'Glutes / Lower Abs',
        description: 'Lying on your back, knees bent, tighten abs and glutes and raise your hips.',
        difficulty: 'Intermediate',
        thumbnailColor: '#D1FAE5',
        instructions: [
            'Lie on your back with knees bent and feet flat on the floor.',
            'Tighten your lower abdominals and squeeze your buttocks.',
            'Raise your buttocks off the floor to create a "bridge" with your body.',
            'Hold, then lower and repeat. Do 12 reps, 1 set, once a day.'
        ]
    },
    {
        id: 'c5',
        category: 'Core',
        mode: 'partner',
        title: 'Bridging Crossed Leg',
        time: '5 min',
        target: 'Glutes / Core',
        description: 'Bridging with one leg crossed; partner helps hold the other knee straight. 12 reps.',
        difficulty: 'Intermediate',
        thumbnailColor: '#A7F3D0',
        instructions: [
            'Lie on your back and cross one leg over the other (e.g., right ankle on left knee).',
            'Tighten your lower abdominals and squeeze your buttocks; raise your buttocks off the floor.',
            'Have a partner help hold your supporting knee straight if needed. Do 12 reps, 1 set, once a day.'
        ]
    },
    {
        id: 'c6',
        category: 'Core',
        mode: 'partner',
        title: 'Single Leg Bridge',
        time: '5 min',
        target: 'Glutes / Core',
        description: 'Knees bent, extend one leg, raise hips keeping pelvis level. 5 reps.',
        difficulty: 'Advanced',
        thumbnailColor: '#6EE7B7',
        instructions: [
            'Lie on your back with knees bent. Extend one knee so that leg is straight.',
            'Raise your buttocks off the floor, keeping your pelvis level.',
            'Have someone hold your heels if needed. Do 5 reps, 1 set, once a day.'
        ]
    },
    {
        id: 'c7',
        category: 'Core',
        mode: 'solo',
        title: 'Weight Shift - Lateral',
        time: '4 min',
        target: 'Balance / Core',
        description: 'Standing, slowly shift body weight side-to-side. Keep body straight and upright.',
        difficulty: 'Beginner',
        thumbnailColor: '#34D399',
        instructions: [
            'Stand in a safe position (near support if needed).',
            'Slowly shift your body weight side to side.',
            'Keep your body straight and upright throughout. Repeat 10 times, 1 set, once a day.'
        ]
    },
    {
        id: 'c8',
        category: 'Core',
        mode: 'solo',
        title: 'Pelvic Tilt (Standing)',
        time: '4 min',
        target: 'Lower Back / Pelvis',
        description: 'Standing, arch your low back then flatten it repeatedly through a comfortable range.',
        difficulty: 'Beginner',
        thumbnailColor: '#10B981',
        instructions: [
            'Stand with good posture.',
            'Arch your low back slightly, then flatten it (posterior pelvic tilt).',
            'Your pelvis tilts forward and back. Move through a comfortable range. Repeat 10 times, 1 set, once a day.'
        ]
    },
    {
        id: 'c9',
        category: 'Core',
        mode: 'solo',
        title: 'Sit to Stand - Thigh Support',
        time: '6 min',
        target: 'Legs / Core',
        description: 'Scoot to front of chair, hands on thighs for support, lean forward, rise to standing.',
        difficulty: 'Intermediate',
        thumbnailColor: '#059669',
        instructions: [
            'Scoot to the front of the chair. Check your foot placement (especially on the weaker side).',
            'Lean forward and place your hands on your thighs for support.',
            'Push through your legs and rise to standing, ensuring weight goes through the intended leg.',
            'Slowly lower back down: use your hands, flex forward, bend knees, and stick your buttocks back. Do 10 reps, 1 set, once a day.'
        ]
    },
    {
        id: 'c10',
        category: 'Core',
        mode: 'solo',
        title: 'Wobble Board Balance',
        time: '5 min',
        target: 'Balance',
        description: 'Stand on a wobble board and practice balancing. Do not let the sides touch the floor.',
        difficulty: 'Intermediate',
        thumbnailColor: '#047857',
        instructions: [
            'Stand on a wobble board.',
            'Practice balancing. Do not let the sides of the board touch the floor.',
            'Repeat for the prescribed time (e.g., several minutes).'
        ]
    },
    {
        id: 'c11',
        category: 'Core',
        mode: 'solo',
        title: 'Weight Lift with Knee Raise',
        time: '5 min',
        target: 'Balance / Coordination',
        description: 'Stand holding a small weight, lift arm forward while raising knee on the same side.',
        difficulty: 'Intermediate',
        thumbnailColor: '#D1FAE5',
        instructions: [
            'Stand straight holding a 1–2 kg weight in one hand.',
            'Lift the weight with your arm straight forward.',
            'Then lift your knee on the same side of your body.',
            'Keep your balance. Repeat as prescribed.'
        ]
    },
    {
        id: 'c12',
        category: 'Core',
        mode: 'solo',
        title: 'Weight Transfer (Standing)',
        time: '4 min',
        target: 'Balance',
        description: 'Stand with legs apart, feet parallel; transfer weight from one leg to the other.',
        difficulty: 'Beginner',
        thumbnailColor: '#A7F3D0',
        instructions: [
            'Stand with your legs apart and feet parallel.',
            'Transfer your weight from one leg to the other.',
            'Repeat for the prescribed number of times.'
        ]
    },
];

export default function Exercises() {
    const { user, userData } = useAuth();
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedMode, setSelectedMode] = useState('All');
    const [expandedCardId, setExpandedCardId] = useState(null);
    const [completedExercises, setCompletedExercises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [customExercises, setCustomExercises] = useState([]);
    const [assignedExercises, setAssignedExercises] = useState(new Map());
    const [modalVisible, setModalVisible] = useState(false);
    const [exerciseToEdit, setExerciseToEdit] = useState(null);
    const [recommendedExercises, setRecommendedExercises] = useState([]);
    const [recommendedIds, setRecommendedIds] = useState(new Set());
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [visualGuideExerciseId, setVisualGuideExerciseId] = useState(null);
    const [recommendationFilter, setRecommendationFilter] = useState('all'); // 'all' | 'ai_recommended' | 'staff_assigned'

    const scrollViewRef = useRef(null);
    const cardPositions = useRef({});

    useEffect(() => {
        if (user) {
            fetchCompletedExercises();
            fetchCustomExercises();
            fetchAssignedExercises();
            fetchRecommendations();
        }
    }, [user]);

    const fetchCompletedExercises = async () => {
        try {
            const { log, error } = await SupabaseService.getTodayLog(user.id);
            if (log && log.exercises_completed) {
                setCompletedExercises(log.exercises_completed);
            } else {
                setCompletedExercises([]);
            }
        } catch (error) {
            console.error('Error fetching completed exercises:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomExercises = async () => {
        if (!user) return;
        try {
            const { data, error } = await SupabaseService.getCustomExercises(user.id);
            if (error) {
                console.error('Error fetching custom exercises:', error);
                return;
            }
            setCustomExercises(data || []);
        } catch (error) {
            console.error('Error fetching custom exercises:', error);
        }
    };

    const fetchAssignedExercises = async () => {
        if (!user) return;
        try {
            const { assignments, error } = await MedicalStaffService.getAssignedExercises(user.id);
            if (error) {
                console.error('Error fetching assigned exercises:', error);
                return;
            }
            const activeAssignments = (assignments || []).filter(a => a.status === 'assigned');
            const assignmentMap = new Map();
            activeAssignments.forEach(a => {
                assignmentMap.set(a.exercise_id, {
                    notes: a.notes,
                    assignerName: a.assigned_by?.name || 'Your care team',
                    dueDate: a.due_date,
                    id: a.id,
                });
            });
            setAssignedExercises(assignmentMap);
        } catch (error) {
            console.error('Error fetching assigned exercises:', error);
        }
    };

    const fetchRecommendations = async () => {
        try {
            const { profile } = await SupabaseService.getUserProfile(user.id);
            if (profile) {
                const { recommended } = getRecommendedExercises(profile, EXERCISES_DATA);
                setRecommendedExercises(recommended);
                setRecommendedIds(new Set(recommended.map(r => r.id)));
            }
        } catch (error) {
            console.error('Error fetching recommendations:', error);
        }
    };

    const toggleCompletion = async (exerciseId) => {
        if (!user) {
            // Should not happen in normal flow if protected, but safe guard
            console.warn('User not logged in, cannot toggle completion');
            return;
        }

        // Optimistic update
        const isCompleted = completedExercises.includes(exerciseId);
        let newCompleted = [];

        if (isCompleted) {
            newCompleted = completedExercises.filter(id => id !== exerciseId);
        } else {
            newCompleted = [...completedExercises, exerciseId];
        }

        setCompletedExercises(newCompleted);

        // API call
        const { error } = await SupabaseService.toggleExerciseCompletion(user.id, exerciseId);

        if (error) {
            // Revert on error
            console.error('Error toggling completion:', error);
            setCompletedExercises(completedExercises);
            alert('Failed to update status. Please try again.');
        } else {
            // If this was an assigned exercise, update assignment status
            if (!isCompleted && assignedExercises.has(exerciseId)) {
                // Find the assignment and update its status
                const { assignments } = await MedicalStaffService.getAssignedExercises(user.id);
                const assignment = assignments?.find(a => a.exercise_id === exerciseId && a.status === 'assigned');
                if (assignment) {
                    await MedicalStaffService.updateAssignment(assignment.id, { status: 'completed' });
                    await fetchAssignedExercises(); // Refresh assignments
                }
            }

            // Success! If we just completed it (was not completed before), award points
            if (!isCompleted) {
                const { points } = await SupabaseService.getUserPoints(user.id);
                await SupabaseService.updateUserPoints(user.id, points + 10);
                Alert.alert('Great Job!', 'You earned 10 points! 🌱');
            }
        }
    };

    // Merge built-in and custom exercises
    const allExercises = [
        ...EXERCISES_DATA.map(ex => ({ ...ex, isCustom: false })),
        ...customExercises
    ];

    const filteredExercises = allExercises.filter(ex => {
        const categoryMatch = selectedCategory === 'All' || ex.category === selectedCategory;
        const modeMatch = selectedMode === 'All' || ex.mode === selectedMode.toLowerCase();
        const recommendationMatch =
            recommendationFilter === 'all' ||
            (recommendationFilter === 'ai_recommended' && recommendedIds.has(ex.id)) ||
            (recommendationFilter === 'staff_assigned' && assignedExercises.has(ex.id));
        return categoryMatch && modeMatch && recommendationMatch;
    });

    const handleSaveExercise = async (exerciseData, exerciseId) => {
        if (!user) return;

        try {
            if (exerciseId) {
                // Update existing exercise
                const { error } = await SupabaseService.updateCustomExercise(exerciseId, exerciseData);
                if (error) throw error;
            } else {
                // Create new exercise
                const { error } = await SupabaseService.createCustomExercise(user.id, exerciseData);
                if (error) throw error;
            }
            // Refresh custom exercises
            await fetchCustomExercises();
        } catch (error) {
            throw error;
        }
    };

    const handleDeleteExercise = (exerciseId) => {
        Alert.alert(
            'Delete Exercise',
            'Are you sure you want to delete this custom exercise? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const { error } = await SupabaseService.deleteCustomExercise(exerciseId);
                        if (error) {
                            Alert.alert('Error', 'Failed to delete exercise. Please try again.');
                        } else {
                            await fetchCustomExercises();
                            // Also remove from completed exercises if it was completed
                            if (completedExercises.includes(exerciseId)) {
                                await toggleCompletion(exerciseId);
                            }
                        }
                    }
                }
            ]
        );
    };

    const handleEditExercise = (exercise) => {
        setExerciseToEdit(exercise);
        setModalVisible(true);
    };

    const handleOpenCreateModal = () => {
        setExerciseToEdit(null);
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setExerciseToEdit(null);
    };

    const toggleExpand = (id) => {
        setExpandedCardId(expandedCardId === id ? null : id);
    };

    const handleRecommendedPress = (exerciseId) => {
        setSelectedCategory('All');
        setSelectedMode('All');
        setRecommendationFilter('all');
        setExpandedCardId(exerciseId);

        setTimeout(() => {
            const yPosition = cardPositions.current[exerciseId];
            if (scrollViewRef.current && yPosition !== undefined) {
                scrollViewRef.current.scrollTo({ y: yPosition - 20, animated: true });
            }
        }, 100);
    };

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View style={styles.headerText}>
                        <Text style={styles.headerTitle}>Recovery Exercises</Text>
                        <Text style={styles.headerSubtitle}>Daily movements for your recovery</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={handleOpenCreateModal}
                        accessibilityLabel="Add custom exercise"
                    >
                        <Plus size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.categoryContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryContent}
                >
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={[
                                styles.categoryChip,
                                selectedCategory === cat && styles.categoryChipActive
                            ]}
                            onPress={() => setSelectedCategory(cat)}
                        >
                            <Text style={[
                                styles.categoryText,
                                selectedCategory === cat && styles.categoryTextActive
                            ]}>
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View style={styles.modeContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.modeContent}
                >
                    {MODE_TYPES.map((mode) => (
                        <TouchableOpacity
                            key={mode}
                            style={[
                                styles.modeChip,
                                selectedMode === mode && styles.modeChipActive
                            ]}
                            onPress={() => setSelectedMode(mode)}
                        >
                            <Text style={[
                                styles.modeText,
                                selectedMode === mode && styles.modeTextActive
                            ]}>
                                {mode === 'Solo' ? '🧍 Solo' : mode === 'Partner' ? '🤝 Partner' : mode}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View style={styles.modeContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.modeContent}
                >
                    {RECOMMENDATION_FILTERS.map(({ value, label }) => (
                        <TouchableOpacity
                            key={value}
                            style={[
                                styles.modeChip,
                                recommendationFilter === value && styles.modeChipActive
                            ]}
                            onPress={() => setRecommendationFilter(value)}
                        >
                            <Text style={[
                                styles.modeText,
                                recommendationFilter === value && styles.modeTextActive
                            ]}>
                                {label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView ref={scrollViewRef} style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {recommendedExercises.length > 0 && (
                    <View style={styles.recommendedSection}>
                        <View style={styles.recommendedHeader}>
                            <Text style={styles.recommendedTitle}>Recommended for You</Text>
                            <TouchableOpacity onPress={() => setShowInfoModal(true)} style={styles.infoButton} accessibilityRole="button" accessibilityLabel="How recommendations work">
                                <Info size={20} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        {recommendedExercises.map((exercise) => (
                            <TouchableOpacity
                                key={`rec-${exercise.id}`}
                                style={styles.recommendedCard}
                                onPress={() => handleRecommendedPress(exercise.id)}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.recommendedDot, { backgroundColor: exercise.thumbnailColor }]} />
                                <View style={styles.recommendedCardContent}>
                                    <Text style={styles.recommendedCardTitle}>{exercise.title}</Text>
                                    <Text style={styles.recommendedCardReason}>{exercise.recommendationReason}</Text>
                                </View>
                                <TouchableOpacity
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        toggleCompletion(exercise.id);
                                    }}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    accessibilityRole="checkbox"
                                    accessibilityState={{ checked: completedExercises.includes(exercise.id) }}
                                    accessibilityLabel={`Mark ${exercise.title} complete`}
                                >
                                    {completedExercises.includes(exercise.id) ? (
                                        <CheckCircle size={24} color={Colors.primary} />
                                    ) : (
                                        <Circle size={24} color={Colors.border} />
                                    )}
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))}
                        <Text style={styles.recommendedDisclaimer}>
                            Based on your profile. Always consult your care team.
                        </Text>
                    </View>
                )}

                {filteredExercises.map((exercise) => {
                    const isAssigned = assignedExercises.has(exercise.id);
                    const assignmentDetails = assignedExercises.get(exercise.id);
                    const isShared = exercise.isCustom && exercise.userId !== user?.id;
                    return (
                        <View
                            key={exercise.id}
                            onLayout={(e) => {
                                cardPositions.current[exercise.id] = e.nativeEvent.layout.y;
                            }}
                        >
                            <ExerciseCard
                                data={exercise}
                                isExpanded={expandedCardId === exercise.id}
                                isCompleted={completedExercises.includes(exercise.id)}
                                isCustom={exercise.isCustom}
                                isAssigned={isAssigned}
                                isRecommended={recommendedIds.has(exercise.id)}
                                assignmentDetails={assignmentDetails}
                                isShared={isShared}
                                onPress={() => toggleExpand(exercise.id)}
                                onToggleComplete={() => toggleCompletion(exercise.id)}
                                onEdit={exercise.isCustom && !isShared ? () => handleEditExercise(exercise) : undefined}
                                onDelete={exercise.isCustom && !isShared ? () => handleDeleteExercise(exercise.id) : undefined}
                                onShowGuide={getExerciseHasVisualGuide(exercise.id) ? () => setVisualGuideExerciseId(exercise.id) : undefined}
                            />
                        </View>
                    );
                })}
                <View style={styles.footerSpacer} />
            </ScrollView>

            <CustomExerciseModal
                visible={modalVisible}
                onClose={handleCloseModal}
                exercise={exerciseToEdit}
                onSave={handleSaveExercise}
                userId={user?.id}
                userRole={userData?.role || 'survivor'}
            />

            <ExerciseVisualGuide
                visible={!!visualGuideExerciseId}
                exerciseId={visualGuideExerciseId}
                onClose={() => setVisualGuideExerciseId(null)}
            />

            <Modal
                visible={showInfoModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowInfoModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowInfoModal(false)}
                >
                    <View style={styles.infoSheet}>
                        <View style={styles.infoSheetHandle} />
                        <Text style={styles.infoSheetTitle}>How Recommendations Work</Text>
                        <Text style={styles.infoSheetText}>
                            These exercises were selected based on your recovery profile, including your impairments, affected side, and recovery phase.
                        </Text>
                        <Text style={styles.infoSheetText}>
                            Your care team can also assign specific exercises, which will always appear first.
                        </Text>
                        <Text style={styles.infoSheetText}>
                            You can update your profile anytime from the About Me screen.
                        </Text>
                        <TouchableOpacity
                            style={styles.infoSheetClose}
                            onPress={() => setShowInfoModal(false)}
                        >
                            <Text style={styles.infoSheetCloseText}>Got it</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </ScreenWrapper>
    );
}

function ExerciseCard({ data, isExpanded, isCompleted, isCustom, isAssigned, isRecommended, assignmentDetails, isShared, onPress, onToggleComplete, onEdit, onDelete, onShowGuide }) {
    const [showConfetti, setShowConfetti] = useState(false);

    const handleToggleComplete = (e) => {
        e.stopPropagation();

        // Only celebrate when completing, not un-completing
        if (!isCompleted) {
            // Trigger haptic feedback
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // Trigger confetti animation
            setShowConfetti(true);
        }

        onToggleComplete();
    };

    const handleConfettiComplete = () => {
        setShowConfetti(false);
    };

    return (
        <TouchableOpacity
            style={[styles.card, isExpanded && styles.cardExpanded, isCustom && styles.cardCustom, isAssigned && styles.cardAssigned]}
            onPress={onPress}
            activeOpacity={0.9}
        >
            <View style={[styles.thumbnail, { backgroundColor: data.thumbnailColor }]}>
                <PlayCircle size={40} color={Colors.text} style={{ opacity: 0.6 }} />
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>
                        {data.category}{isCustom ? ' • Custom' : ''}{isAssigned ? ' • Assigned' : ''}{isRecommended ? ' • Recommended' : ''}
                    </Text>
                </View>

                <View style={styles.topLeftActions}>
                    {isCustom && onEdit && (
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={(e) => {
                                e.stopPropagation();
                                onEdit();
                            }}
                            accessibilityLabel="Edit exercise"
                        >
                            <Edit size={18} color={Colors.text} />
                        </TouchableOpacity>
                    )}
                    {isCustom && onDelete && (
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                            accessibilityLabel="Delete exercise"
                        >
                            <Trash2 size={18} color="#EF4444" />
                        </TouchableOpacity>
                    )}
                    <View style={styles.checkboxWrapper}>
                        <TouchableOpacity
                            style={styles.checkboxContainer}
                            onPress={handleToggleComplete}
                        >
                            {isCompleted ? (
                                <CheckCircle size={28} color={Colors.primary} fill="white" />
                            ) : (
                                <Circle size={28} color="rgba(0,0,0,0.3)" fill="rgba(255,255,255,0.8)" />
                            )}
                        </TouchableOpacity>
                        <ConfettiBurst
                            trigger={showConfetti}
                            onComplete={handleConfettiComplete}
                        />
                    </View>
                </View>
            </View>

            <View style={styles.info}>
                <View style={styles.headerRow}>
                    <Text style={styles.title}>{data.title}</Text>
                    {isExpanded ?
                        <ChevronUp size={20} color={Colors.textSecondary} /> :
                        <ChevronDown size={20} color={Colors.textSecondary} />
                    }
                </View>

                <View style={styles.meta}>
                    {data.time && (
                        <View style={styles.metaItem}>
                            <Clock size={14} color={Colors.textSecondary} />
                            <Text style={styles.metaText}>{data.time}</Text>
                        </View>
                    )}
                    {data.target && (
                        <View style={styles.metaItem}>
                            <Target size={14} color={Colors.textSecondary} />
                            <Text style={styles.metaText}>{data.target}</Text>
                        </View>
                    )}
                    {data.difficulty && (
                        <View style={[styles.difficultyBadge,
                        data.difficulty === 'Beginner' ? styles.diffEasy :
                            data.difficulty === 'Intermediate' ? styles.diffMed : styles.diffHard
                        ]}>
                            <Text style={styles.difficultyText}>{data.difficulty}</Text>
                        </View>
                    )}
                </View>

                {isShared && data.creatorName && (
                    <Text style={styles.sharedBy}>
                        Shared by {data.creatorName}
                    </Text>
                )}

                {isAssigned && assignmentDetails && (
                    <View style={styles.assignmentInfo}>
                        <Text style={styles.assignedBy}>
                            Assigned by {assignmentDetails.assignerName}
                        </Text>
                        {assignmentDetails.notes && (
                            <Text style={styles.assignmentNotes}>
                                "{assignmentDetails.notes}"
                            </Text>
                        )}
                        {assignmentDetails.dueDate && (
                            <Text style={styles.assignmentDueDate}>
                                Due: {new Date(assignmentDetails.dueDate).toLocaleDateString()}
                            </Text>
                        )}
                    </View>
                )}

                {data.description && (
                    <Text style={styles.description}>{data.description}</Text>
                )}

                {isExpanded && (
                    <View style={styles.instructionsContainer}>
                        <View style={styles.divider} />
                        {onShowGuide && (
                            <TouchableOpacity
                                style={styles.watchDemoButton}
                                onPress={(e) => { e.stopPropagation(); onShowGuide(); }}
                            >
                                <PlayCircle size={18} color="white" />
                                <Text style={styles.watchDemoText}>Watch Visual Guide</Text>
                            </TouchableOpacity>
                        )}
                        <Text style={styles.instructionsTitle}>How to do it:</Text>
                        {data.instructions.map((step, index) => (
                            <View key={index} style={styles.stepRow}>
                                <Text style={styles.stepNumber}>{index + 1}.</Text>
                                <Text style={styles.stepText}>{step}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 16,
        backgroundColor: Colors.background,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerText: {
        flex: 1,
    },
    headerTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 28,
        color: Colors.text,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: Colors.textSecondary,
    },
    addButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    categoryContainer: {
        backgroundColor: Colors.background,
        paddingBottom: 16,
    },
    categoryContent: {
        paddingHorizontal: 24,
        gap: 12,
    },
    categoryChip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 24,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    categoryChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    categoryText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: Colors.textSecondary,
    },
    categoryTextActive: {
        color: 'white',
    },
    modeContainer: {
        backgroundColor: Colors.background,
        paddingBottom: 12,
    },
    modeContent: {
        paddingHorizontal: 24,
        gap: 10,
    },
    modeChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
    },
    modeChipActive: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
    },
    modeText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
        color: Colors.textSecondary,
    },
    modeTextActive: {
        color: 'white',
    },
    content: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        padding: 24,
        paddingTop: 8,
    },
    footerSpacer: {
        height: 40,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    cardExpanded: {
        borderColor: Colors.primary,
        shadowOpacity: 0.1,
    },
    cardCustom: {
        borderLeftWidth: 3,
        borderLeftColor: Colors.primary,
    },
    cardAssigned: {
        borderTopWidth: 3,
        borderTopColor: Colors.success,
    },
    thumbnail: {
        width: '100%',
        height: 160,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    categoryBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    categoryBadgeText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 13,
        color: Colors.text,
    },
    topLeftActions: {
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 10,
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    editButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    deleteButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    checkboxWrapper: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible',
    },
    checkboxContainer: {
        // Checkbox is positioned within topLeftActions flex container
    },
    info: {
        padding: 20,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    title: {
        fontFamily: 'Inter_700Bold',
        fontSize: 18,
        color: Colors.text,
        flex: 1,
        marginRight: 12,
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
        color: Colors.textSecondary,
    },
    difficultyBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    diffEasy: { backgroundColor: '#DCFCE7' },
    diffMed: { backgroundColor: '#FEF9C3' },
    diffHard: { backgroundColor: '#FEE2E2' },
    difficultyText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 13,
        color: Colors.text,
    },
    description: {
        fontFamily: 'Inter_400Regular',
        fontSize: 15,
        color: Colors.textSecondary,
        lineHeight: 24,
    },
    sharedBy: {
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
        color: Colors.primary,
        marginBottom: 12,
        fontStyle: 'italic',
    },
    assignmentInfo: {
        marginBottom: 12,
        padding: 10,
        backgroundColor: '#F0FDF4',
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#10B981',
    },
    assignedBy: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 13,
        color: '#059669',
        marginBottom: 4,
    },
    assignmentNotes: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: Colors.text,
        fontStyle: 'italic',
        marginBottom: 4,
    },
    assignmentDueDate: {
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
        color: Colors.textSecondary,
    },
    instructionsContainer: {
        marginTop: 20,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginBottom: 20,
    },
    watchDemoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.primary,
        borderRadius: 12,
        paddingVertical: 12,
        marginBottom: 16,
    },
    watchDemoText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 15,
        color: 'white',
    },
    instructionsTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: Colors.text,
        marginBottom: 12,
    },
    stepRow: {
        flexDirection: 'row',
        marginBottom: 12,
        paddingRight: 10,
    },
    stepNumber: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 15,
        color: Colors.primary,
        width: 28,
    },
    stepText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 15,
        color: Colors.text,
        lineHeight: 24,
        flex: 1,
        flexShrink: 1,
        flexWrap: 'wrap',
    },
    // Recommended section
    recommendedSection: {
        marginBottom: 24,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    recommendedHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    recommendedTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 18,
        color: Colors.text,
    },
    infoButton: {
        padding: 4,
    },
    recommendedCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    recommendedDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 12,
    },
    recommendedCardContent: {
        flex: 1,
    },
    recommendedCardTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 15,
        color: Colors.text,
    },
    recommendedCardReason: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    recommendedDisclaimer: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: Colors.textTertiary,
        marginTop: 12,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    // Info modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    infoSheet: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    infoSheetHandle: {
        width: 40,
        height: 4,
        backgroundColor: Colors.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    infoSheetTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 20,
        color: Colors.text,
        marginBottom: 16,
    },
    infoSheetText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 15,
        color: Colors.textSecondary,
        lineHeight: 22,
        marginBottom: 12,
    },
    infoSheetClose: {
        backgroundColor: Colors.primary,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 12,
    },
    infoSheetCloseText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: 'white',
    },
});

