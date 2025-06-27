import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DealsComponent } from './deals.component';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('DealsComponent', () => {
  let component: DealsComponent;
  let fixture: ComponentFixture<DealsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DealsComponent], // since it's standalone
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({}), // or use expected route params here
            snapshot: { data: {} }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DealsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
