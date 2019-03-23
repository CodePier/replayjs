<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

class RecordDomChanges implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    private $data;
    private $session;

    /**
     * Create a new job instance.
     *
     * @param $session
     * @param $data
     */
    public function __construct($session, $data)
    {
        $this->data = $data;
        $this->session = $session;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        Cache::lock($this->session)->get(function () {
            Cache::tags([$this->session, 'dom_changes'])->put(hrtime(true), $this->data);
        });
    }
}
