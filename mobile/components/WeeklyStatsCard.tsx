import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface WeeklyStatsCardProps {
    stats: {
        completed: number;
        remaining: number;
        percentage: number;
    };
}

export const WeeklyStatsCard: React.FC<WeeklyStatsCardProps> = ({ stats }) => {
    return (
        <View style={styles.statsContainer}>
            <View style={styles.statsCard}>
                <Text style={styles.statsTitle}>Weekly Stats</Text>
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: '#E65100' }]}>{stats.completed}</Text>
                        <Text style={styles.statLabel}>Completed</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: '#333' }]}>{stats.remaining}</Text>
                        <Text style={styles.statLabel}>Remaining</Text>
                    </View>
                    <View style={[styles.statItem, { alignItems: 'flex-end' }]}>
                        <Text style={[styles.statValue, { color: '#E65100' }]}>{stats.percentage}%</Text>
                        <Text style={styles.statLabel}>Done</Text>
                    </View>
                </View>
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${stats.percentage}%` }]} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    statsContainer: {
        paddingHorizontal: 20,
        marginTop: -30,
        marginBottom: 20,
    },
    statsCard: {
        backgroundColor: '#FFF3E0',
        borderRadius: 25,
        padding: 22,
        shadowColor: '#E65100',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 8,
    },
    statsTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#BF360C',
        marginBottom: 18,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 18,
    },
    statItem: {
        flex: 1,
    },
    statValue: {
        fontSize: 34,
        fontWeight: '900',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#8D6E63',
        textTransform: 'uppercase',
    },
    progressBarBg: {
        height: 10,
        backgroundColor: '#fff',
        borderRadius: 5,
        width: '100%',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#FF6D00',
        borderRadius: 5,
    },
});
