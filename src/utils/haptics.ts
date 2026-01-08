import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { Capacitor } from '@capacitor/core'

export async function hapticTap() {
  if (Capacitor.isNativePlatform()) {
    await Haptics.impact({ style: ImpactStyle.Light })
  }
}

export async function hapticSuccess() {
  if (Capacitor.isNativePlatform()) {
    await Haptics.notification({ type: NotificationType.Success })
  }
}

export async function hapticWarning() {
  if (Capacitor.isNativePlatform()) {
    await Haptics.notification({ type: NotificationType.Warning })
  }
}
