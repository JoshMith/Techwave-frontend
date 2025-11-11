import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AudioSoundComponent } from './audio-sound.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('AudioSoundComponent', () => {
  let component: AudioSoundComponent;
  let fixture: ComponentFixture<AudioSoundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AudioSoundComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AudioSoundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
