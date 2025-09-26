// Sistema de tracking de conversiones para la landing page
// Este archivo se puede integrar en multiserve-web

interface ConversionEvent {
  event: string;
  timestamp: Date;
  plan?: string;
  userAgent?: string;
  referrer?: string;
  sessionId: string;
}

class ConversionTracker {
  private sessionId: string;
  private events: ConversionEvent[] = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeTracking();
  }

  private generateSessionId(): string {
    // Generar un UUID v4 real
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private initializeTracking(): void {
    // Track page load
    this.trackEvent('page_load');
    
    // Track scroll depth
    this.trackScrollDepth();
    
    // Track time on page
    this.trackTimeOnPage();
  }

  private trackScrollDepth(): void {
    let maxScroll = 0;
    const scrollThresholds = [25, 50, 75, 90, 100];
    const trackedThresholds = new Set<number>();

    window.addEventListener('scroll', () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        
        scrollThresholds.forEach(threshold => {
          if (scrollPercent >= threshold && !trackedThresholds.has(threshold)) {
            trackedThresholds.add(threshold);
            this.trackEvent('scroll_depth', { depth: threshold });
          }
        });
      }
    });
  }

  private trackTimeOnPage(): void {
    const timeThresholds = [30, 60, 120, 300]; // segundos
    const trackedTimes = new Set<number>();

    timeThresholds.forEach(seconds => {
      setTimeout(() => {
        if (!trackedTimes.has(seconds)) {
          trackedTimes.add(seconds);
          this.trackEvent('time_on_page', { seconds });
        }
      }, seconds * 1000);
    });
  }

  public trackEvent(event: string, data?: any): void {
    const eventData: ConversionEvent = {
      event,
      timestamp: new Date(),
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      ...data
    };

    this.events.push(eventData);
    console.log('📊 Conversion Event:', eventData);
    
    // Enviar a analytics (puedes integrar con Google Analytics, Mixpanel, etc.)
    this.sendToAnalytics(eventData);
  }

  public trackPlanView(planName: string): void {
    this.trackEvent('plan_view', { plan: planName });
  }

  public trackDemoRequest(planName: string): void {
    this.trackEvent('demo_request', { plan: planName });
  }

  public trackContactForm(): void {
    this.trackEvent('contact_form_submit');
  }

  public trackVideoPlay(): void {
    this.trackEvent('video_play');
  }

  public trackPricingView(): void {
    this.trackEvent('pricing_view');
  }

  public trackTestimonialView(): void {
    this.trackEvent('testimonial_view');
  }

  private sendToAnalytics(eventData: ConversionEvent): void {
    // Aquí puedes integrar con diferentes servicios de analytics
    try {
      // Google Analytics 4
      if (typeof gtag !== 'undefined') {
        gtag('event', eventData.event, {
          event_category: 'conversion',
          event_label: eventData.plan || 'general',
          value: this.getEventValue(eventData.event),
          custom_parameter_1: eventData.sessionId,
          custom_parameter_2: eventData.timestamp.toISOString()
        });
      }

      // Mixpanel
      if (typeof mixpanel !== 'undefined') {
        mixpanel.track(eventData.event, {
          plan: eventData.plan,
          session_id: eventData.sessionId,
          timestamp: eventData.timestamp.toISOString(),
          user_agent: eventData.userAgent,
          referrer: eventData.referrer
        });
      }

      // Enviar a tu propio backend
      this.sendToBackend(eventData);
      
    } catch (error) {
      console.warn('Error sending to analytics:', error);
    }
  }

  private getEventValue(event: string): number {
    const eventValues: Record<string, number> = {
      'page_load': 1,
      'scroll_depth': 2,
      'time_on_page': 3,
      'plan_view': 5,
      'demo_request': 10,
      'contact_form_submit': 15,
      'video_play': 8,
      'pricing_view': 6,
      'testimonial_view': 4
    };
    
    return eventValues[event] || 1;
  }

  private async sendToBackend(eventData: ConversionEvent): Promise<void> {
    try {
      // Mapear eventos del frontend a tipos válidos del backend
      const eventTypeMap: Record<string, string> = {
        'page_load': 'page_view',
        'scroll_depth': 'scroll_depth',
        'time_on_page': 'time_on_page',
        'plan_view': 'button_click',
        'demo_request': 'demo_request',
        'contact_form_submit': 'form_submit',
        'video_play': 'video_play',
        'pricing_view': 'button_click',
        'testimonial_view': 'button_click'
      };

      // Convertir el formato del frontend al formato esperado por el backend
      const backendData = {
        event_type: eventTypeMap[eventData.event] || 'button_click',
        timestamp: eventData.timestamp,
        session_id: eventData.sessionId,
        user_agent: eventData.userAgent,
        referrer: eventData.referrer || '',
        plan_name: eventData.plan,
        metadata: {
          original_event: eventData.event,
          ...eventData,
          // Agregar cualquier dato adicional que venga en el evento
        }
      };

      // Enviar a tu backend para análisis interno
      await fetch('http://localhost:4000/api/conversion-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendData)
      });
    } catch (error) {
      console.warn('Error sending to backend:', error);
    }
  }

  public getSessionData(): { sessionId: string; events: ConversionEvent[] } {
    return {
      sessionId: this.sessionId,
      events: this.events
    };
  }

  public getConversionFunnel(): { step: string; count: number }[] {
    const funnelSteps = [
      'page_load',
      'scroll_depth',
      'plan_view',
      'demo_request',
      'contact_form_submit'
    ];

    return funnelSteps.map(step => ({
      step,
      count: this.events.filter(e => e.event === step).length
    }));
  }
}

// Exportar para uso en React
export default ConversionTracker;

// Hook de React para usar el tracker
export const useConversionTracker = () => {
  const tracker = new ConversionTracker();
  
  return {
    trackPlanView: (planName: string) => tracker.trackPlanView(planName),
    trackDemoRequest: (planName: string) => tracker.trackDemoRequest(planName),
    trackContactForm: () => tracker.trackContactForm(),
    trackVideoPlay: () => tracker.trackVideoPlay(),
    trackPricingView: () => tracker.trackPricingView(),
    trackTestimonialView: () => tracker.trackTestimonialView(),
    getSessionData: () => tracker.getSessionData(),
    getConversionFunnel: () => tracker.getConversionFunnel()
  };
};
