import * as React from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'solito/navigation'
import { useCallback, useMemo } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { USER_ROLE_OPTIONS } from '../auth/types'
import {
  getAccessibleMobileRoutes,
  type MobileRouteItem,
} from '../mobile/mobile-routes'
import { MobileModuleCard } from '../mobile/tournament-screens'

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  content: {
    padding: 16,
    gap: 10,
    paddingBottom: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 6,
  },
  roleWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 2,
  },
  roleButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
  },
  roleButtonActive: {
    borderColor: '#0ea5e9',
    backgroundColor: '#e0f2fe',
  },
  roleButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  roleButtonTextActive: {
    color: '#0369a1',
  },
  moduleSeparator: {
    height: 8,
  },
  emptyBox: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    padding: 14,
  },
  emptyTitle: {
    color: '#991b1b',
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyText: {
    color: '#b91c1c',
    fontSize: 12,
  },
})

const RoleButton = React.memo(function RoleButton({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      style={[styles.roleButton, active && styles.roleButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.roleButtonText, active && styles.roleButtonTextActive]}>
        {label}
      </Text>
    </Pressable>
  )
})

export function HomeScreen() {
  const router = useRouter()
  const { currentUser, setRole } = useAuth()

  const modules = useMemo(
    () => getAccessibleMobileRoutes(currentUser.role),
    [currentUser.role]
  )

  const roleLabel = useMemo(
    () =>
      USER_ROLE_OPTIONS.find((item) => item.value === currentUser.role)?.label ??
      currentUser.role,
    [currentUser.role]
  )

  const renderModuleCard = useCallback(
    ({ item }: { item: MobileRouteItem }) => (
      <MobileModuleCard
        title={item.title}
        subtitle={item.subtitle}
        onPress={() => router.push(`/${item.nativePath}`)}
      />
    ),
    [router]
  )

  const rolePanel = useMemo(
    () => (
      <View>
        <Text style={styles.title}>VCT Platform</Text>
        <Text style={styles.subtitle}>
          Điều hướng nhanh toàn bộ module nghiệp vụ trên mobile
        </Text>

        <Text style={[styles.subtitle, { marginBottom: 8 }]}>
          Quyền hiện tại: {roleLabel}
        </Text>
        <View style={styles.roleWrap}>
          {USER_ROLE_OPTIONS.map((roleOption) => (
            <RoleButton
              key={roleOption.value}
              label={roleOption.label}
              active={roleOption.value === currentUser.role}
              onPress={() => setRole(roleOption.value)}
            />
          ))}
        </View>
      </View>
    ),
    [currentUser.role, roleLabel, setRole]
  )

  const emptyState = useMemo(
    () => (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyTitle}>
          Vai trò hiện tại chưa được cấp module mobile.
        </Text>
        <Text style={styles.emptyText}>
          Hãy đổi role khác để tiếp tục.
        </Text>
      </View>
    ),
    []
  )

  return (
    <FlatList
      data={modules}
      style={styles.page}
      contentContainerStyle={styles.content}
      keyExtractor={(item) => item.key}
      renderItem={renderModuleCard}
      ItemSeparatorComponent={() => <View style={styles.moduleSeparator} />}
      ListHeaderComponent={rolePanel}
      ListEmptyComponent={emptyState}
    />
  )
}
