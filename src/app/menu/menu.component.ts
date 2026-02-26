import {
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
  effect,
  ElementRef,
  ViewChildren,
  QueryList,
  AfterViewInit,
  HostListener,
} from '@angular/core';
import { MenuService } from '../services/menu.service';
import { MenuData, MenuItem, ShopInfo } from '../models/menu.model';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/all';
gsap.registerPlugin(Draggable);

@Component({
  selector: 'app-menu',
  imports: [], 
  templateUrl: './menu.component.html',
})
export class MenuComponent implements OnInit, OnDestroy, AfterViewInit {
  private menuService = inject(MenuService);

  categoryThemes: Record<string, string> = {
    All: '#EBE7E0',
    Breakfast: '#F2EEE7',
    Croissants: '#E2D9C8',
    'Hot Coffee': '#D9C8BA',
    'Cold Coffee': '#D6C7B3',
    'Hot Tea': '#E5E1D8',
    'Cold Drinks': '#DDE2D6',
    'Kids Breakfast': '#EFE5D2',
  };
  categories = [
    'All',
    'Breakfast',
    'Kids Breakfast',
    'Croissants',
    'Hot Coffee',
    'Cold Coffee',
    'Hot Tea',
    'Cold Drinks',
  ];
  heroSlides = [
  ];

  currentSlide = signal(0);
  private slideInterval: any;
  selectedCategory = signal<string>('All');
  menuItems = signal<MenuItem[]>([]);
  shopInfo = signal<ShopInfo | null>(null);
  isCategoryVisible = signal(true);
  isScrolled = signal(false); 
  private lastScrollTop = 0;
  searchQuery = signal<string>('');

  currentTheme = computed(() => this.categoryThemes[this.selectedCategory()] || '#1A1A1A');

  foodList = computed(() => {
    const cat = this.selectedCategory();
    const query = this.searchQuery().toLowerCase();
    
    return this.menuItems().filter(item => {
      const isFood = item.type === 'food';
      const matchesCat = cat === 'All' || item.category === cat;
      const matchesSearch = item.name.toLowerCase().includes(query) || 
                            (item.description && item.description.toLowerCase().includes(query));
      
      return isFood && matchesCat && matchesSearch;
    });
  });

  drinkList = computed(() => {
    const cat = this.selectedCategory();
    const query = this.searchQuery().toLowerCase();
    
    return this.menuItems().filter(item => {
      const isDrink = item.type === 'drink';
      const matchesCat = cat === 'All' || item.category === cat;
      const matchesSearch = item.name.toLowerCase().includes(query);
      
      return isDrink && matchesCat && matchesSearch;
    });
  });
  carouselFoodList = computed(() => {
    const list = this.foodList();
    if (list.length === 0) return [];

    let padded = [...list];

    while (padded.length < 12) {
      padded = [...padded, ...list];
    }

    return padded.map((item, index) => ({
      ...item,
      _uniqueId: `${item.id}-${index}`,
    }));
  });

  @ViewChildren('galleryCard') galleryCards!: QueryList<ElementRef>;
  private scrollTriggerInstance?: ScrollTrigger;
  private draggableInstance?: Draggable[];
  private scrubTween: any;
  private spacing = 0.1;
  private seamlessLoop: any; 
  private initTimeout: any;

  constructor() {
    effect(() => {
      const items = this.foodList();
      if (items.length > 0) {
        setTimeout(() => this.initGsapGallery(), 100);
      }
    });
  }

  ngOnInit() {
    this.menuService.getAllItems().subscribe({
      next: (data) => this.menuItems.set(data),
      error: (err) => console.error('Failed to load menu', err),
    });
    this.startAutoSlide();
    this.menuService.getShopInfo().subscribe((info) => {
      this.shopInfo.set(info);
    });
  }
  ngAfterViewInit() {
    this.galleryCards.changes.subscribe(() => {
      if (this.galleryCards.length > 0) {
        clearTimeout(this.initTimeout);
        this.initTimeout = setTimeout(() => this.initGsapGallery(), 100);
      }
    });

    if (this.galleryCards.length > 0) {
      clearTimeout(this.initTimeout);
      this.initTimeout = setTimeout(() => this.initGsapGallery(), 100);
    }
  }

  ngOnDestroy() {
    if (this.slideInterval) clearInterval(this.slideInterval);
    if (this.draggableInstance) this.draggableInstance.forEach((d) => d.kill());
  }

  selectCategory(category: string) {
    if (this.draggableInstance) this.draggableInstance.forEach((d) => d.kill());
    if (this.scrubTween) this.scrubTween.kill();
    if (this.seamlessLoop) this.seamlessLoop.kill();
    this.selectedCategory.set(category);
  }

  startAutoSlide() {
    this.slideInterval = setInterval(() => {
      this.currentSlide.update((index) => (index + 1) % this.heroSlides.length);
    }, 5000);
  }

  onSearchChange(event: Event) {
    const input = (event.target as HTMLInputElement).value;
    if (this.draggableInstance) this.draggableInstance.forEach(d => d.kill());
    if (this.scrubTween) this.scrubTween.kill();
    if (this.seamlessLoop) this.seamlessLoop.kill();
    this.searchQuery.set(input);
  }

@HostListener('window:scroll', [])
  onWindowScroll() {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    this.isScrolled.set(currentScroll > 20);
    if (currentScroll > this.lastScrollTop && currentScroll > 80) {
      this.isCategoryVisible.set(false);
    } else {
      this.isCategoryVisible.set(true);
    }
    this.lastScrollTop = currentScroll <= 0 ? 0 : currentScroll; 
  }

  private initGsapGallery() {
    const cardElements = this.galleryCards.map((c) => c.nativeElement);
    if (cardElements.length === 0) return;
    if (this.draggableInstance) this.draggableInstance.forEach((d) => d.kill());
    if (this.scrubTween) this.scrubTween.kill();
    if (this.seamlessLoop) this.seamlessLoop.kill();
    gsap.set(cardElements, { xPercent: 400, opacity: 0, scale: 0 });
    const snapTime = gsap.utils.snap(this.spacing);
    const animateFunc = (element: any) => {
      const tl = gsap.timeline();
      tl.fromTo(
        element,
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          zIndex: 100,
          duration: 0.5,
          yoyo: true,
          repeat: 1,
          ease: 'power1.in',
          immediateRender: false,
        },
      ).fromTo(
        element,
        { xPercent: 400 },
        { xPercent: -400, duration: 1, ease: 'none', immediateRender: false },
        0,
      );
      return tl;
    };

    this.seamlessLoop = this.buildSeamlessLoop(cardElements, this.spacing, animateFunc);
    const playhead = { offset: 0 };
    const wrapTime = gsap.utils.wrap(0, this.seamlessLoop.duration());

    this.scrubTween = gsap.to(playhead, {
      offset: 0,
      onUpdate: () => {
        this.seamlessLoop.time(wrapTime(playhead.offset));
      },
      duration: 0.5,
      ease: 'power3',
      paused: true,
    });

    this.seamlessLoop.time(wrapTime(playhead.offset));
    const scrollToOffset = (offset: number) => {
      let snappedTime = snapTime(offset);
      gsap.to(this.scrubTween.vars, {
        offset: snappedTime,
        duration: 0.4,
        ease: 'power2.out',
        onUpdate: () => this.scrubTween.invalidate().restart(),
      });
    };

    const that = this;
    this.draggableInstance = Draggable.create('.drag-proxy', {
      type: 'x',
      trigger: '.gallery-container',
      onPress: function (this: any) {
        this.startOffset = (that.scrubTween.vars as any).offset || 0;
      },
      onDrag: function (this: any) {
        (that.scrubTween.vars as any).offset =
          this.startOffset + (this['startX'] - this['x']) * 0.0015;
        that.scrubTween.invalidate().restart();
      },
      onDragEnd: function (this: any) {
        scrollToOffset((that.scrubTween.vars as any).offset);
      },
    });
  }

  private buildSeamlessLoop(items: any[], spacing: number, animateFunc: Function) {
    let overlap = Math.ceil(1 / spacing),
      startTime = items.length * spacing + 0.5,
      loopTime = (items.length + overlap) * spacing + 1,
      rawSequence = gsap.timeline({ paused: true }),
      seamlessLoop = gsap.timeline({
        paused: true,
        repeat: -1,
        onRepeat: function (this: any) {
          this['_time'] === this['_dur'] && (this['_tTime'] += this['_dur'] - 0.01);
        },
      }),
      l = items.length + overlap * 2,
      time = 0,
      i = 0,
      index = 0;

    for (i = 0; i < l; i++) {
      index = i % items.length;
      time = i * spacing;
      rawSequence.add(animateFunc(items[index]), time);
      i <= items.length && seamlessLoop.add('label' + i, time);
    }
    rawSequence.time(startTime);
    seamlessLoop
      .to(rawSequence, {
        time: loopTime,
        duration: loopTime - startTime,
        ease: 'none',
      })
      .fromTo(
        rawSequence,
        { time: overlap * spacing + 1 },
        {
          time: startTime,
          duration: startTime - (overlap * spacing + 1),
          immediateRender: false,
          ease: 'none',
        },
      );
    return seamlessLoop;
  }

  nextSlide() {
    if (!this.scrubTween) return;
    const currentOffset = (this.scrubTween.vars as any).offset || 0;
    let snappedTime = gsap.utils.snap(this.spacing, currentOffset + this.spacing);
    gsap.to(this.scrubTween.vars, {
      offset: snappedTime,
      duration: 0.4,
      ease: 'power2.out',
      onUpdate: () => this.scrubTween.invalidate().restart(),
    });
  }

  prevSlide() {
    if (!this.scrubTween) return;
    const currentOffset = (this.scrubTween.vars as any).offset || 0;
    let snappedTime = gsap.utils.snap(this.spacing, currentOffset - this.spacing);
    gsap.to(this.scrubTween.vars, {
      offset: snappedTime,
      duration: 0.4,
      ease: 'power2.out',
      onUpdate: () => this.scrubTween.invalidate().restart(),
    });
  }
}
